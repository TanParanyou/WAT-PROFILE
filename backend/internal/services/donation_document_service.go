package services

import (
	"bytes"
	"crypto/sha256"
	"fmt"
	"strconv"
	"strings"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

// ReceiptConfig กำหนดข้อความทั้งหมดในใบเสร็จ ให้ปรับแต่งแก้ไขได้ง่ายๆ ในที่เดียว
type ReceiptConfig struct {
	// หัวเอกสาร (Header)
	OrganizationName     string // ชื่อวัด / องค์กร เช่น "WAT LOUNG POR SAI"
	RegisterTitle        string // ชื่อบันทึกทะเบียน เช่น "THE APOTHECARY REGISTER - TEMPLE RECORD"
	OrganizationSubtitle string // คำอธิบายองค์กร เช่น "Theravada Buddhist Temple & Community Association e.V."
	ContactLine          string // ข้อมูลติดต่อ เช่น "Website: www.watloungporsai.de | Email: info@watloungporsai.de"

	// กล่องข้อความอนุโมทนาบุญและขอบคุณ (Acknowledgement & Blessing)
	AcknowledgementTitle string // หัวข้อ เช่น "OFFICIAL ACKNOWLEDGEMENT"
	AcknowledgementLine1 string // บรรทัดที่ 1
	AcknowledgementLine2 string // บรรทัดที่ 2
	BlessingQuote        string // คำอวยพร / อนุโมทนา

	// ส่วนลงนาม (Signatory)
	SignatoryTitle    string // ตำแหน่ง เช่น "Authorized Registrar"
	SignatorySubtitle string // หน่วยงาน เช่น "Wat Loung Por Sai Administration"

	// ท้ายเอกสาร (Footer)
	FooterLine1 string // ข้อความท้ายกระดาษ บรรทัด 1
	FooterLine2 string // ข้อความท้ายกระดาษ บรรทัด 2
}

// DefaultReceiptConfig ข้อความมาตรฐานของวัดหลวงพ่อสายตาม DESIGN.md
var DefaultReceiptConfig = ReceiptConfig{
	OrganizationName:     "WAT LOUNG POR SAI",
	RegisterTitle:        "THE APOTHECARY REGISTER - TEMPLE RECORD",
	OrganizationSubtitle: "Theravada Buddhist Temple & Community Association e.V.",
	ContactLine:          "Website: www.watloungporsai.de | Email: info@watloungporsai.de",

	AcknowledgementTitle: "OFFICIAL ACKNOWLEDGEMENT",
	AcknowledgementLine1: "Wat Loung Por Sai gratefully acknowledges this contribution in support of temple operations,",
	AcknowledgementLine2: "monk sustenance, cultural preservation, and ongoing charitable activities.",
	BlessingQuote:        "May your wholesome deeds bring enduring peace, joy, and prosperity to you and your family.",

	SignatoryTitle:    "Authorized Registrar",
	SignatorySubtitle: "Wat Loung Por Sai Administration",

	FooterLine1: "Wat Loung Por Sai - Official Temple Register Receipt",
	FooterLine2: "Retain this official electronic document for personal records.",
}

// DonationDocumentService renders a deterministic, immutable receipt document.
// It follows the DESIGN.md creative north star: "ทะเบียนศาลา — The Apothecary Register".
type DonationDocumentService struct {
	config ReceiptConfig
}

func NewDonationDocumentService(configs ...ReceiptConfig) *DonationDocumentService {
	cfg := DefaultReceiptConfig
	if len(configs) > 0 {
		cfg = configs[0]
	}
	return &DonationDocumentService{config: cfg}
}

func (s *DonationDocumentService) SetConfig(cfg ReceiptConfig) {
	s.config = cfg
}

func (s *DonationDocumentService) RenderReceipt(donation *models.Donation) ([]byte, string, error) {
	if donation == nil || donation.ReceiptNumber == "" {
		return nil, "", fmt.Errorf("donation receipt number is required")
	}

	cfg := s.config
	if cfg.OrganizationName == "" {
		cfg = DefaultReceiptConfig
	}

	donorName := donation.DonorName
	if donorName == "" {
		if donation.IsAnonymous {
			donorName = "Anonymous Donor"
		} else {
			donorName = "Valued Donor"
		}
	}

	amountStr := strconv.FormatFloat(donation.Amount, 'f', 2, 64) + " " + donation.Currency
	dateStr := donation.DonationDate.Format("2006-01-02")
	timeStr := ""
	if donation.DonationTime != nil && strings.TrimSpace(string(*donation.DonationTime)) != "" {
		timeStr = strings.TrimSpace(string(*donation.DonationTime))
	}

	methodStr := strings.ToUpper(donation.DonationMethod)
	if methodStr == "" {
		methodStr = "BANK_TRANSFER"
	}

	categoryStr := "Temple Activities & Maintenance"
	if donation.Category != nil {
		if en, ok := donation.Category.Name["en"]; ok && strings.TrimSpace(en) != "" {
			categoryStr = strings.TrimSpace(en)
		} else if th, ok := donation.Category.Name["th"]; ok && strings.TrimSpace(th) != "" {
			categoryStr = strings.TrimSpace(th)
		}
	}

	var ops []string

	// ==================== 1. CANVAS BACKGROUND ====================
	// Register Canvas (#FFFEF2: 1.0, 0.996, 0.949)
	ops = append(ops,
		"1.00 0.996 0.949 rg",
		"0 0 595.28 841.89 re f",
	)

	// ==================== 2. STRUCTURAL FRAMES & HAIRLINES ====================
	// Outer Double Hairline Frame (Register Ink #333333 & Quiet Graphite #666666)
	ops = append(ops,
		"0.20 0.20 0.20 RG", // Register Ink
		"1.0 w",
		"36 36 523.28 770 re S",
		"0.40 0.40 0.40 RG", // Quiet Graphite
		"0.5 w",
		"40 40 515.28 762 re S",
	)

	// Top Terracotta Accent Bar (Terracotta Marker #945C26: 0.58, 0.36, 0.15)
	ops = append(ops,
		"0.58 0.36 0.15 rg",
		"36 802 523.28 4 re f",
	)

	// Header Separator Rule (Register Ink Hairline)
	ops = append(ops,
		"0.20 0.20 0.20 RG",
		"1.0 w",
		"54 722 487.28 0 m 541.28 722 l S",
	)

	// ==================== 3. DONOR & RECORD SECTION ====================
	// Taupe Surface Container (#F7ECDD: 0.969, 0.925, 0.867)
	ops = append(ops,
		"0.969 0.925 0.867 rg",
		"0.20 0.20 0.20 RG",
		"0.75 w",
		"54 590 487.28 118 re b",
		// Vertical Column Divider Hairline
		"0.40 0.40 0.40 RG",
		"0.5 w",
		"297.64 596 0 106 re S",
	)

	// ==================== 4. REGISTER TABLE ====================
	// Table Header Box (Register Ink #333333 Fill, Inverse Canvas Text)
	ops = append(ops,
		"0.20 0.20 0.20 rg",
		"54 538 487.28 26 re f",
	)

	// Table Data Row (Register Canvas with Hairline Border)
	ops = append(ops,
		"1.00 0.996 0.949 rg",
		"0.20 0.20 0.20 RG",
		"0.75 w",
		"54 480 487.28 58 re b",
		// Inner Sub-row Hairline
		"0.80 0.80 0.80 RG",
		"0.5 w",
		"54 509 487.28 0 m 541.28 509 l S",
	)

	// Table Total Box (Taupe Surface with Register Ink Border)
	ops = append(ops,
		"0.969 0.925 0.867 rg",
		"0.20 0.20 0.20 RG",
		"1.0 w",
		"54 440 487.28 32 re b",
	)

	// ==================== 5. ACKNOWLEDGEMENT NOTE BOX ====================
	// Quiet Container with Left Terracotta Indicator
	ops = append(ops,
		"1.00 0.996 0.949 rg",
		"0.40 0.40 0.40 RG",
		"0.75 w",
		"54 334 487.28 90 re b",
		// Terracotta Marker Left Border (Scarcity accent)
		"0.58 0.36 0.15 rg",
		"54 334 3.5 90 re f",
	)

	// ==================== 6. SIGNATURE & VERIFICATION ====================
	// Signatory Hairline
	ops = append(ops,
		"0.20 0.20 0.20 RG",
		"0.75 w",
		"350 195 170 0 m 520 195 l S",
	)

	// Footer Hairline Divider
	ops = append(ops,
		"0.20 0.20 0.20 RG",
		"0.5 w",
		"54 88 487.28 0 m 541.28 88 l S",
	)

	// ==================== 7. TYPOGRAPHY & REGISTER TEXT ====================
	text := func(font string, size int, r, g, b float64, x, y int, content string) {
		ops = append(ops, fmt.Sprintf(
			"BT /%s %d Tf %.3f %.3f %.3f rg %d %d Td (%s) Tj ET",
			font, size, r, g, b, x, y, pdfEscape(content),
		))
	}

	// Header: Temple Register North Star
	text("F2", 17, 0.20, 0.20, 0.20, 54, 778, cfg.OrganizationName)
	text("F1", 9, 0.40, 0.40, 0.40, 54, 763, cfg.RegisterTitle)
	text("F1", 8, 0.40, 0.40, 0.40, 54, 750, cfg.OrganizationSubtitle)
	text("F1", 8, 0.40, 0.40, 0.40, 54, 738, cfg.ContactLine)

	// Header Right: Official Register Metadata
	text("F2", 13, 0.20, 0.20, 0.20, 360, 778, "DONATION RECEIPT")
	text("F2", 10, 0.58, 0.36, 0.15, 360, 762, "Receipt: "+donation.ReceiptNumber)
	text("F1", 8, 0.40, 0.40, 0.40, 360, 748, "Issued Date: "+dateStr)
	text("F2", 8, 0.20, 0.20, 0.20, 360, 735, "STATUS: CONFIRMED")

	// Donor Information (Left Column)
	text("F2", 8, 0.58, 0.36, 0.15, 68, 690, "REGISTERED DONOR")
	text("F2", 11, 0.20, 0.20, 0.20, 68, 672, "Donor: "+donorName)
	if donation.DonorEmail != "" {
		text("F1", 8, 0.40, 0.40, 0.40, 68, 654, "Email: "+donation.DonorEmail)
	} else {
		text("F1", 8, 0.50, 0.50, 0.50, 68, 654, "Email: -")
	}
	if donation.DonorPhone != "" {
		text("F1", 8, 0.40, 0.40, 0.40, 68, 638, "Phone: "+donation.DonorPhone)
	} else {
		text("F1", 8, 0.50, 0.50, 0.50, 68, 638, "Phone: -")
	}
	if donation.DonorAddress != "" {
		text("F1", 8, 0.40, 0.40, 0.40, 68, 622, "Address: "+donation.DonorAddress)
	} else {
		text("F1", 8, 0.50, 0.50, 0.50, 68, 622, "Address: -")
	}

	// Transaction Entry (Right Column)
	text("F2", 8, 0.58, 0.36, 0.15, 312, 690, "ENTRY RECORD")
	text("F1", 8, 0.20, 0.20, 0.20, 312, 672, "Receipt No: "+donation.ReceiptNumber)
	text("F1", 8, 0.20, 0.20, 0.20, 312, 654, "Entry Date: "+dateStr)
	if timeStr != "" {
		text("F1", 8, 0.20, 0.20, 0.20, 312, 638, "Time: "+timeStr)
	} else {
		text("F1", 8, 0.20, 0.20, 0.20, 312, 638, "Time: -")
	}
	text("F1", 8, 0.20, 0.20, 0.20, 312, 622, "Method: "+methodStr)

	// Table Header (Inverse Canvas text on Register Ink)
	text("F2", 8, 1.00, 0.996, 0.949, 68, 547, "ITEM / PURPOSE")
	text("F2", 8, 1.00, 0.996, 0.949, 265, 547, "METHOD")
	text("F2", 8, 1.00, 0.996, 0.949, 395, 547, "DATE")
	text("F2", 8, 1.00, 0.996, 0.949, 475, 547, "AMOUNT")

	// Table Row Data
	text("F2", 9, 0.20, 0.20, 0.20, 68, 520, "Religious & Charitable Contribution")
	text("F1", 8, 0.40, 0.40, 0.40, 68, 495, "Category: "+categoryStr)

	text("F1", 8, 0.20, 0.20, 0.20, 265, 520, methodStr)
	text("F1", 8, 0.20, 0.20, 0.20, 395, 520, dateStr)
	text("F2", 9, 0.20, 0.20, 0.20, 465, 520, amountStr)

	// Table Total
	text("F2", 9, 0.20, 0.20, 0.20, 68, 452, "TOTAL AMOUNT CONFIRMED")
	text("F2", 11, 0.58, 0.36, 0.15, 450, 450, amountStr)

	// Official Acknowledgement & Blessing
	text("F2", 8, 0.58, 0.36, 0.15, 72, 404, cfg.AcknowledgementTitle)
	text("F1", 8, 0.20, 0.20, 0.20, 72, 388, cfg.AcknowledgementLine1)
	text("F1", 8, 0.20, 0.20, 0.20, 72, 374, cfg.AcknowledgementLine2)
	text("F3", 8, 0.40, 0.40, 0.40, 72, 354, cfg.BlessingQuote)

	// Signature & Verification Block
	text("F1", 7, 0.40, 0.40, 0.40, 68, 195, "Register Verification Reference:")
	text("F1", 7, 0.40, 0.40, 0.40, 68, 182, "Document ID: "+donation.ReceiptNumber)
	text("F1", 7, 0.40, 0.40, 0.40, 68, 170, "Electronic Register Record - Wat Loung Por Sai")

	text("F2", 8, 0.20, 0.20, 0.20, 370, 180, cfg.SignatoryTitle)
	text("F1", 7, 0.40, 0.40, 0.40, 370, 166, cfg.SignatorySubtitle)

	// Footer
	text("F1", 7, 0.40, 0.40, 0.40, 175, 72, cfg.FooterLine1)
	text("F1", 7, 0.50, 0.50, 0.50, 185, 60, cfg.FooterLine2)

	// Combine all operations
	contentBytes := []byte(strings.Join(ops, "\n"))

	var b bytes.Buffer
	b.WriteString("%PDF-1.4\n")
	offsets := []int{0}
	writeObj := func(n int, body string) {
		offsets = append(offsets, b.Len())
		fmt.Fprintf(&b, "%d 0 obj\n%s\nendobj\n", n, body)
	}

	writeObj(1, "<< /Type /Catalog /Pages 2 0 R >>")
	writeObj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
	writeObj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>")
	writeObj(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
	writeObj(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
	writeObj(6, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>")
	writeObj(7, fmt.Sprintf("<< /Length %d >>\nstream\n%s\nendstream", len(contentBytes), contentBytes))

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


