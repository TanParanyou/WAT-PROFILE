package services

import (
	"context"
	"fmt"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

type DonationEmailService struct {
	sender accountauth.EmailSender
}

func NewDonationEmailService(sender accountauth.EmailSender) *DonationEmailService {
	return &DonationEmailService{sender: sender}
}

func (s *DonationEmailService) SendAcknowledgement(ctx context.Context, donation *models.Donation) error {
	if s == nil || s.sender == nil || donation == nil || donation.DonorEmail == "" {
		return nil
	}
	locale := donation.CommunicationLocale
	if locale == "" {
		locale = "th"
	}
	subject, body := acknowledgementCopy(locale, donation)
	return s.sender.Send(ctx, accountauth.EmailMessage{To: donation.DonorEmail, Locale: locale, Subject: subject, Body: body})
}

func (s *DonationEmailService) SendReceipt(ctx context.Context, donation *models.Donation, pdf []byte) error {
	if s == nil || s.sender == nil || donation == nil || donation.DonorEmail == "" {
		return nil
	}
	locale := donation.CommunicationLocale
	if locale == "" {
		locale = "th"
	}
	subject, body := receiptCopy(locale, donation)
	return s.sender.Send(ctx, accountauth.EmailMessage{To: donation.DonorEmail, Locale: locale, Subject: subject, Body: body, Attachments: []accountauth.EmailAttachment{{Filename: donation.ReceiptNumber + ".pdf", ContentType: "application/pdf", Data: pdf}}})
}

func acknowledgementCopy(locale string, d *models.Donation) (string, string) {
	switch locale {
	case "en":
		return "Donation received", fmt.Sprintf("Thank you for your donation of %.2f %s. We received your report and will review it shortly. Receipt: %s.", d.Amount, d.Currency, d.ReceiptNumber)
	case "de":
		return "Spende erhalten", fmt.Sprintf("Vielen Dank für Ihre Spende über %.2f %s. Wir prüfen Ihre Meldung in Kürze. Beleg: %s.", d.Amount, d.Currency, d.ReceiptNumber)
	default:
		return "ได้รับข้อมูลการบริจาคแล้ว", fmt.Sprintf("ขอบคุณสำหรับการบริจาค %.2f %s เราได้รับข้อมูลและจะตรวจสอบโดยเร็ว ใบรับรายการ: %s", d.Amount, d.Currency, d.ReceiptNumber)
	}
}

func receiptCopy(locale string, d *models.Donation) (string, string) {
	switch locale {
	case "en":
		return "Your donation receipt", fmt.Sprintf("Your donation has been confirmed. Receipt %s is attached.", d.ReceiptNumber)
	case "de":
		return "Ihre Spendenquittung", fmt.Sprintf("Ihre Spende wurde bestätigt. Die Quittung %s ist angehängt.", d.ReceiptNumber)
	default:
		return "ใบเสร็จการบริจาคของคุณ", fmt.Sprintf("ยืนยันการบริจาคแล้ว ใบเสร็จ %s แนบมากับอีเมลนี้", d.ReceiptNumber)
	}
}
