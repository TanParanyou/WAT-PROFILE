package publiccontent

import (
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

// AboutContent defines the DTO for the About page.
type AboutContent struct {
	Title       models.MultiLangText `json:"title"`
	Description models.MultiLangText `json:"description"`
	SEO         models.JSONMap       `json:"seo"`
	Body        AboutBody            `json:"body"`
	UpdatedAt   time.Time            `json:"updated_at"`
}

type AboutBody struct {
	Intro          AboutIntro          `json:"intro"`
	Objective      AboutObjective      `json:"objective"`
	Administration AboutAdministration `json:"administration"`
	History        AboutHistory        `json:"history"`
	Buildings      AboutBuildings      `json:"buildings"`
	Sangha         AboutSangha         `json:"sangha"`
}

type AboutIntro struct {
	Heading     models.MultiLangText `json:"heading"`
	Description models.MultiLangText `json:"description"`
	Founded     models.MultiLangText `json:"founded"`
	Location    models.MultiLangText `json:"location"`
}

type AboutObjective struct {
	Heading  models.MultiLangText     `json:"heading"`
	Subtitle models.MultiLangText     `json:"subtitle"`
	Content  models.LocalizedRichText `json:"content"`
}

type AboutAdministration struct {
	Heading models.MultiLangText     `json:"heading"`
	Content models.LocalizedRichText `json:"content"`
}

type AboutHistory struct {
	Heading models.MultiLangText     `json:"heading"`
	Content models.LocalizedRichText `json:"content"`
}

type AboutBuildings struct {
	Heading models.MultiLangText `json:"heading"`
	Items   []BuildingItem       `json:"items"`
}

type BuildingItem struct {
	Name        models.MultiLangText `json:"name"`
	Description models.MultiLangText `json:"description"`
}

type AboutSangha struct {
	Heading models.MultiLangText     `json:"heading"`
	Mission models.MultiLangText     `json:"mission"`
	Content models.LocalizedRichText `json:"content"`
}

// ContactContent defines the DTO for the Contact page.
type ContactContent struct {
	Title       models.MultiLangText `json:"title"`
	Description models.MultiLangText `json:"description"`
	SEO         models.JSONMap       `json:"seo"`
	Body        ContactBody          `json:"body"`
	UpdatedAt   time.Time            `json:"updated_at"`
}

type ContactBody struct {
	Address      models.MultiLangText `json:"address"`
	Phone        string               `json:"phone"`
	Email        string               `json:"email"`
	OpeningHours ContactOpeningHours  `json:"opening_hours"`
	Map          ContactMap           `json:"map"`
	Transport    ContactTransport     `json:"transport"`
	Socials      ContactSocials       `json:"socials"`
	Bank         ContactBank          `json:"bank"`
	ContactForm  ContactFormSettings  `json:"contact_form"`
}

type ContactOpeningHours struct {
	Days   models.MultiLangText `json:"days"`
	Time   models.MultiLangText `json:"time"`
	Notice models.MultiLangText `json:"notice"`
}

type ContactMap struct {
	Name          models.MultiLangText `json:"name"`
	EmbedURL      string               `json:"embed_url"`
	DirectionsURL string               `json:"directions_url"`
}

type ContactTransport struct {
	Parking         models.MultiLangText   `json:"parking"`
	PublicTransport []models.MultiLangText `json:"public_transport"`
	Driving         models.MultiLangText   `json:"driving"`
}

type ContactSocials struct {
	Facebook  string `json:"facebook"`
	Instagram string `json:"instagram"`
	Messenger string `json:"messenger"`
	Line      string `json:"line"`
	Youtube   string `json:"youtube"`
}

type ContactBank struct {
	BankName      models.MultiLangText `json:"bank_name"`
	AccountName   models.MultiLangText `json:"account_name"`
	AccountNumber string               `json:"account_number"`
	IBAN          string               `json:"iban"`
	BIC           string               `json:"bic"`
}

type ContactFormSettings struct {
	Enabled         bool                 `json:"enabled"`
	SuccessMessage  models.MultiLangText `json:"success_message"`
	PrivacyPageLink string               `json:"privacy_page_link"`
}

// PrivacyContent defines the DTO for the Privacy page.
type PrivacyContent struct {
	Title     models.MultiLangText `json:"title"`
	SEO       models.JSONMap       `json:"seo"`
	Body      PrivacyBody          `json:"body"`
	UpdatedAt time.Time            `json:"updated_at"`
}

type PrivacyBody struct {
	Content     models.LocalizedRichText `json:"content"`
	LastUpdated time.Time                `json:"last_updated"`
}

// ImpressumContent defines the DTO for the Impressum page.
type ImpressumContent struct {
	Title       models.MultiLangText `json:"title"`
	Description models.MultiLangText `json:"description"`
	SEO         models.JSONMap       `json:"seo"`
	Body        ImpressumBody        `json:"body"`
	UpdatedAt   time.Time            `json:"updated_at"`
}

type ImpressumBody struct {
	OrganizationName      models.MultiLangText `json:"organization_name"`
	LegalForm             models.MultiLangText `json:"legal_form"`
	Address               models.MultiLangText `json:"address"`
	Phone                 string               `json:"phone"`
	Email                 string               `json:"email"`
	Representative        models.MultiLangText `json:"representative"`
	RegistryCourt         models.MultiLangText `json:"registry_court"`
	RegistryNumber        string               `json:"registry_number"`
	VatID                 string               `json:"vat_id"`
	ContentResponsibility models.MultiLangText `json:"content_responsibility"`
}
