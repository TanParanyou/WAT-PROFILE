package services

import (
	"bytes"
	"crypto/sha256"
	"fmt"
	"strconv"
	"strings"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

// DonationDocumentService renders a deterministic, immutable receipt document.
// It intentionally has no network or database dependency, so it can be tested
// and rendered before the object is stored privately.
type DonationDocumentService struct{}

func NewDonationDocumentService() *DonationDocumentService { return &DonationDocumentService{} }

func (s *DonationDocumentService) RenderReceipt(donation *models.Donation) ([]byte, string, error) {
	if donation == nil || donation.ReceiptNumber == "" {
		return nil, "", fmt.Errorf("donation receipt number is required")
	}
	lines := []string{
		"Wat Loung Por Sai - Donation Receipt",
		"Receipt: " + donation.ReceiptNumber,
		"Donor: " + donation.DonorName,
		"Amount: " + strconv.FormatFloat(donation.Amount, 'f', 2, 64) + " " + donation.Currency,
		"Date: " + donation.DonationDate.Format("2006-01-02"),
	}
	content := make([]string, 0, len(lines))
	for i, line := range lines {
		content = append(content, fmt.Sprintf("BT /F1 12 Tf 72 %d Td (%s) Tj ET", 760-(i*24), pdfEscape(line)))
	}
	contentBytes := []byte(strings.Join(content, "\n"))
	var b bytes.Buffer
	b.WriteString("%PDF-1.4\n")
	offsets := []int{0}
	writeObj := func(n int, body string) {
		offsets = append(offsets, b.Len())
		fmt.Fprintf(&b, "%d 0 obj\n%s\nendobj\n", n, body)
	}
	writeObj(1, "<< /Type /Catalog /Pages 2 0 R >>")
	writeObj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
	writeObj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>")
	writeObj(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
	writeObj(5, fmt.Sprintf("<< /Length %d >>\nstream\n%s\nendstream", len(contentBytes), contentBytes))
	xref := b.Len()
	fmt.Fprintf(&b, "xref\n0 %d\n0000000000 65535 f \n", len(offsets))
	for _, offset := range offsets[1:] {
		fmt.Fprintf(&b, "%010d 00000 n \n", offset)
	}
	fmt.Fprintf(&b, "trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", len(offsets), xref)
	pdf := b.Bytes()
	sum := sha256.Sum256(pdf)
	return pdf, fmt.Sprintf("%x", sum[:]), nil
}

func pdfEscape(value string) string {
	return strings.NewReplacer("\\", "\\\\", "(", "\\(", ")", "\\)", "\n", " ").Replace(value)
}
