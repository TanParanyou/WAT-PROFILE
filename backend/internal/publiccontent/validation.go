package publiccontent

import (
	"fmt"
	"net/mail"
	"net/url"
	"strings"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/richtext"
)

func ValidateAboutContent(req *AboutContent) error {
	if req == nil {
		return fmt.Errorf("request body is required")
	}

	requiredTexts := map[string]models.MultiLangText{
		"title":                       req.Title,
		"description":                 req.Description,
		"body.intro.heading":          req.Body.Intro.Heading,
		"body.intro.description":      req.Body.Intro.Description,
		"body.intro.founded":          req.Body.Intro.Founded,
		"body.intro.location":         req.Body.Intro.Location,
		"body.objective.heading":      req.Body.Objective.Heading,
		"body.objective.subtitle":     req.Body.Objective.Subtitle,
		"body.administration.heading": req.Body.Administration.Heading,
		"body.history.heading":        req.Body.History.Heading,
		"body.buildings.heading":      req.Body.Buildings.Heading,
		"body.sangha.heading":         req.Body.Sangha.Heading,
		"body.sangha.mission":         req.Body.Sangha.Mission,
	}

	for field, value := range requiredTexts {
		if err := requireThaiText(value, field); err != nil {
			return err
		}
	}

	if err := requireRichText(req.Body.Objective.Content, "body.objective.content"); err != nil {
		return err
	}
	if err := requireRichText(req.Body.Administration.Content, "body.administration.content"); err != nil {
		return err
	}
	if err := requireRichText(req.Body.History.Content, "body.history.content"); err != nil {
		return err
	}
	if err := requireRichText(req.Body.Sangha.Content, "body.sangha.content"); err != nil {
		return err
	}

	for i, item := range req.Body.Buildings.Items {
		if err := requireThaiText(item.Name, fmt.Sprintf("body.buildings.items[%d].name", i)); err != nil {
			return err
		}
		if err := requireThaiText(item.Description, fmt.Sprintf("body.buildings.items[%d].description", i)); err != nil {
			return err
		}
	}

	return validateSEO(req.SEO)
}

func ValidateContactContent(req *ContactContent) error {
	if req == nil {
		return fmt.Errorf("request body is required")
	}

	requiredTexts := map[string]models.MultiLangText{
		"title":                             req.Title,
		"description":                       req.Description,
		"body.address":                      req.Body.Address,
		"body.opening_hours.days":           req.Body.OpeningHours.Days,
		"body.opening_hours.time":           req.Body.OpeningHours.Time,
		"body.opening_hours.notice":         req.Body.OpeningHours.Notice,
		"body.map.name":                     req.Body.Map.Name,
		"body.transport.parking":            req.Body.Transport.Parking,
		"body.transport.driving":            req.Body.Transport.Driving,
		"body.bank.bank_name":               req.Body.Bank.BankName,
		"body.bank.account_name":            req.Body.Bank.AccountName,
		"body.contact_form.success_message": req.Body.ContactForm.SuccessMessage,
	}

	for field, value := range requiredTexts {
		if err := requireThaiText(value, field); err != nil {
			return err
		}
	}

	if err := validateOptionalEmail(req.Body.Email, "body.email"); err != nil {
		return err
	}
	if err := validateOptionalURL(req.Body.Map.EmbedURL, "body.map.embed_url"); err != nil {
		return err
	}
	if err := validateOptionalURL(req.Body.Map.DirectionsURL, "body.map.directions_url"); err != nil {
		return err
	}
	if err := validateOptionalURL(req.Body.ContactForm.PrivacyPageLink, "body.contact_form.privacy_page_link"); err != nil {
		return err
	}
	if err := validateOptionalURL(req.Body.Bank.QRImageURL, "body.bank.qr_image_url"); err != nil {
		return err
	}
	for i, value := range req.Body.Transport.PublicTransport {
		if err := requireThaiText(value, fmt.Sprintf("body.transport.public_transport[%d]", i)); err != nil {
			return err
		}
	}
	for field, value := range map[string]string{
		"facebook":  req.Body.Socials.Facebook,
		"instagram": req.Body.Socials.Instagram,
		"messenger": req.Body.Socials.Messenger,
		"youtube":   req.Body.Socials.Youtube,
	} {
		if err := validateOptionalURL(value, fmt.Sprintf("body.socials.%s", field)); err != nil {
			return err
		}
	}

	return validateSEO(req.SEO)
}

func ValidatePrivacyContent(req *PrivacyContent) error {
	if req == nil {
		return fmt.Errorf("request body is required")
	}

	if err := requireThaiText(req.Title, "title"); err != nil {
		return err
	}
	if err := requireRichText(req.Body.Content, "body.content"); err != nil {
		return err
	}

	return validateSEO(req.SEO)
}

func ValidateImpressumContent(req *ImpressumContent) error {
	if req == nil {
		return fmt.Errorf("request body is required")
	}

	requiredTexts := map[string]models.MultiLangText{
		"title":                       req.Title,
		"description":                 req.Description,
		"body.organization_name":      req.Body.OrganizationName,
		"body.legal_form":             req.Body.LegalForm,
		"body.address":                req.Body.Address,
		"body.representative":         req.Body.Representative,
		"body.registry_court":         req.Body.RegistryCourt,
		"body.content_responsibility": req.Body.ContentResponsibility,
	}

	for field, value := range requiredTexts {
		if err := requireThaiText(value, field); err != nil {
			return err
		}
	}

	if err := validateOptionalEmail(req.Body.Email, "body.email"); err != nil {
		return err
	}

	return validateSEO(req.SEO)
}

func requireThaiText(value models.MultiLangText, field string) error {
	if strings.TrimSpace(value["th"]) == "" {
		return fmt.Errorf("%s.th is required", field)
	}
	return nil
}

func requireRichText(value models.LocalizedRichText, field string) error {
	raw, ok := value["th"]
	if !ok || len(strings.TrimSpace(string(raw))) == 0 || string(raw) == "null" {
		return fmt.Errorf("%s.th is required", field)
	}
	if err := richtext.ValidateLocalized(value); err != nil {
		return fmt.Errorf("%s: %w", field, err)
	}
	return nil
}

func validateOptionalEmail(rawValue string, field string) error {
	if strings.TrimSpace(rawValue) == "" {
		return nil
	}

	if _, err := mail.ParseAddress(rawValue); err != nil {
		return fmt.Errorf("%s must be a valid email", field)
	}
	return nil
}

func validateOptionalURL(rawValue string, field string) error {
	if strings.TrimSpace(rawValue) == "" {
		return nil
	}

	if strings.HasPrefix(rawValue, "/") {
		return nil
	}

	parsed, err := url.Parse(rawValue)
	if err != nil {
		return fmt.Errorf("%s must be a valid URL", field)
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return fmt.Errorf("%s must use http or https", field)
	}
	if parsed.Host == "" {
		return fmt.Errorf("%s must include a host", field)
	}
	return nil
}

func validateSEO(seo models.JSONMap) error {
	if seo == nil {
		return nil
	}

	if value, ok := seo["canonical_url"].(string); ok {
		if err := validateOptionalURLOrPath(value, "seo.canonical_url"); err != nil {
			return err
		}
	}
	if value, ok := seo["og_image"].(string); ok {
		if err := validateOptionalURL(value, "seo.og_image"); err != nil {
			return err
		}
	}
	return nil
}

func validateOptionalURLOrPath(rawValue string, field string) error {
	if strings.TrimSpace(rawValue) == "" {
		return nil
	}

	if strings.HasPrefix(rawValue, "/") {
		return nil
	}

	parsed, err := url.Parse(rawValue)
	if err != nil {
		return fmt.Errorf("%s must be a valid URL or path", field)
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return fmt.Errorf("%s must use http or https", field)
	}
	if parsed.Host == "" {
		return fmt.Errorf("%s must include a host", field)
	}
	return nil
}
