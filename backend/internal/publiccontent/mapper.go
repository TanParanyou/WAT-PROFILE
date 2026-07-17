package publiccontent

import (
	"encoding/json"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func normalizeMultiLang(m models.MultiLangText) models.MultiLangText {
	if m == nil {
		m = make(models.MultiLangText)
	}
	for _, lang := range []string{"th", "en", "de"} {
		if _, ok := m[lang]; !ok {
			m[lang] = ""
		}
	}
	return m
}

func normalizeRichText(r models.LocalizedRichText) models.LocalizedRichText {
	if r == nil {
		r = make(models.LocalizedRichText)
	}
	for _, lang := range []string{"th", "en", "de"} {
		if _, ok := r[lang]; !ok {
			r[lang] = json.RawMessage("null")
		}
	}
	return r
}

// AboutFromPage maps ContentPage to AboutContent.
func AboutFromPage(page *models.ContentPage) *AboutContent {
	var body AboutBody
	if page.Body != nil {
		raw, _ := json.Marshal(page.Body)
		_ = json.Unmarshal(raw, &body)
	}

	body.Intro.Heading = normalizeMultiLang(body.Intro.Heading)
	body.Intro.Description = normalizeMultiLang(body.Intro.Description)
	body.Intro.Founded = normalizeMultiLang(body.Intro.Founded)
	body.Intro.Location = normalizeMultiLang(body.Intro.Location)

	body.Objective.Heading = normalizeMultiLang(body.Objective.Heading)
	body.Objective.Subtitle = normalizeMultiLang(body.Objective.Subtitle)
	body.Objective.Content = normalizeRichText(body.Objective.Content)

	body.Administration.Heading = normalizeMultiLang(body.Administration.Heading)
	body.Administration.Content = normalizeRichText(body.Administration.Content)

	body.History.Heading = normalizeMultiLang(body.History.Heading)
	body.History.Content = normalizeRichText(body.History.Content)

	body.Buildings.Heading = normalizeMultiLang(body.Buildings.Heading)
	for i := range body.Buildings.Items {
		body.Buildings.Items[i].Name = normalizeMultiLang(body.Buildings.Items[i].Name)
		body.Buildings.Items[i].Description = normalizeMultiLang(body.Buildings.Items[i].Description)
	}

	body.Sangha.Heading = normalizeMultiLang(body.Sangha.Heading)
	body.Sangha.Mission = normalizeMultiLang(body.Sangha.Mission)
	body.Sangha.Content = normalizeRichText(body.Sangha.Content)

	return &AboutContent{
		Title:       normalizeMultiLang(page.Title),
		Description: normalizeMultiLang(page.Description),
		SEO:         page.Seo,
		Body:        body,
	}
}

// ApplyAbout maps AboutContent fields to ContentPage.
func ApplyAbout(page *models.ContentPage, req *AboutContent) {
	page.Title = normalizeMultiLang(req.Title)
	page.Description = normalizeMultiLang(req.Description)
	page.Seo = req.SEO

	var mergedBody map[string]interface{}
	if page.Body != nil {
		mergedBody = page.Body
	} else {
		mergedBody = make(map[string]interface{})
	}

	rawReq, _ := json.Marshal(req.Body)
	var reqMap map[string]interface{}
	_ = json.Unmarshal(rawReq, &reqMap)

	for k, v := range reqMap {
		mergedBody[k] = v
	}

	page.Body = mergedBody
}

// ContactFromPage maps ContentPage to ContactContent.
func ContactFromPage(page *models.ContentPage) *ContactContent {
	var body ContactBody
	if page.Body != nil {
		raw, _ := json.Marshal(page.Body)
		_ = json.Unmarshal(raw, &body)
	}

	body.Address = normalizeMultiLang(body.Address)
	body.OpeningHours.Days = normalizeMultiLang(body.OpeningHours.Days)
	body.OpeningHours.Time = normalizeMultiLang(body.OpeningHours.Time)
	body.OpeningHours.Notice = normalizeMultiLang(body.OpeningHours.Notice)
	body.Map.Name = normalizeMultiLang(body.Map.Name)
	body.Transport.Parking = normalizeMultiLang(body.Transport.Parking)
	for i := range body.Transport.PublicTransport {
		body.Transport.PublicTransport[i] = normalizeMultiLang(body.Transport.PublicTransport[i])
	}
	body.Transport.Driving = normalizeMultiLang(body.Transport.Driving)

	body.Bank.BankName = normalizeMultiLang(body.Bank.BankName)
	body.Bank.AccountName = normalizeMultiLang(body.Bank.AccountName)

	body.ContactForm.SuccessMessage = normalizeMultiLang(body.ContactForm.SuccessMessage)

	return &ContactContent{
		Title:       normalizeMultiLang(page.Title),
		Description: normalizeMultiLang(page.Description),
		SEO:         page.Seo,
		Body:        body,
	}
}

// ApplyContact maps ContactContent fields to ContentPage.
func ApplyContact(page *models.ContentPage, req *ContactContent) {
	page.Title = normalizeMultiLang(req.Title)
	page.Description = normalizeMultiLang(req.Description)
	page.Seo = req.SEO

	var mergedBody map[string]interface{}
	if page.Body != nil {
		mergedBody = page.Body
	} else {
		mergedBody = make(map[string]interface{})
	}

	rawReq, _ := json.Marshal(req.Body)
	var reqMap map[string]interface{}
	_ = json.Unmarshal(rawReq, &reqMap)

	for k, v := range reqMap {
		mergedBody[k] = v
	}

	page.Body = mergedBody
}

// PrivacyFromPage maps ContentPage to PrivacyContent.
func PrivacyFromPage(page *models.ContentPage) *PrivacyContent {
	var body PrivacyBody
	if page.Body != nil {
		raw, _ := json.Marshal(page.Body)
		_ = json.Unmarshal(raw, &body)
	}

	body.Content = normalizeRichText(body.Content)

	return &PrivacyContent{
		Title: normalizeMultiLang(page.Title),
		SEO:   page.Seo,
		Body:  body,
	}
}

// ApplyPrivacy maps PrivacyContent fields to ContentPage.
func ApplyPrivacy(page *models.ContentPage, req *PrivacyContent) {
	page.Title = normalizeMultiLang(req.Title)
	page.Seo = req.SEO

	var mergedBody map[string]interface{}
	if page.Body != nil {
		mergedBody = page.Body
	} else {
		mergedBody = make(map[string]interface{})
	}

	rawReq, _ := json.Marshal(req.Body)
	var reqMap map[string]interface{}
	_ = json.Unmarshal(rawReq, &reqMap)

	for k, v := range reqMap {
		mergedBody[k] = v
	}

	page.Body = mergedBody
}

// ImpressumFromPage maps ContentPage to ImpressumContent.
func ImpressumFromPage(page *models.ContentPage) *ImpressumContent {
	var body ImpressumBody
	if page.Body != nil {
		raw, _ := json.Marshal(page.Body)
		_ = json.Unmarshal(raw, &body)
	}

	body.OrganizationName = normalizeMultiLang(body.OrganizationName)
	body.LegalForm = normalizeMultiLang(body.LegalForm)
	body.Address = normalizeMultiLang(body.Address)
	body.Representative = normalizeMultiLang(body.Representative)
	body.RegistryCourt = normalizeMultiLang(body.RegistryCourt)
	body.ContentResponsibility = normalizeMultiLang(body.ContentResponsibility)

	return &ImpressumContent{
		Title:       normalizeMultiLang(page.Title),
		Description: normalizeMultiLang(page.Description),
		SEO:         page.Seo,
		Body:        body,
	}
}

// ApplyImpressum maps ImpressumContent fields to ContentPage.
func ApplyImpressum(page *models.ContentPage, req *ImpressumContent) {
	page.Title = normalizeMultiLang(req.Title)
	page.Description = normalizeMultiLang(req.Description)
	page.Seo = req.SEO

	var mergedBody map[string]interface{}
	if page.Body != nil {
		mergedBody = page.Body
	} else {
		mergedBody = make(map[string]interface{})
	}

	rawReq, _ := json.Marshal(req.Body)
	var reqMap map[string]interface{}
	_ = json.Unmarshal(rawReq, &reqMap)

	for k, v := range reqMap {
		mergedBody[k] = v
	}

	page.Body = mergedBody
}
