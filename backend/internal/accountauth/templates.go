package accountauth

import (
	"fmt"
	"html/template"
	"strings"
)

// EmailCopy is one localized variant of a transactional account email.
type EmailCopy struct {
	Subject string
	Body    string // plain-text body, may contain {{.ActionURL}} and {{.DisplayName}}
	Action  string // call-to-action label
}

// EmailTemplateVar is the render context for account emails.
type EmailTemplateVar struct {
	DisplayName string
	ActionURL   string
}

// emailCopy holds complete th/en/de copy for every transactional account email
// purpose. English is the safe fallback when a locale is unknown.
var emailCopy = map[string]map[string]EmailCopy{
	"verify_email": {
		"th": {
			Subject: "ยืนยันอีเมลของคุณ",
			Body:    "สวัสดี {{.DisplayName}},\n\nกรุณายืนยันอีเมลของคุณเพื่อเปิดใช้งานบัญชี โดยคลิกที่ปุ่มด้านล่าง (ลิงก์มีอายุ 30 นาที):\n\n{{.ActionURL}}\n\nหากคุณไม่ได้สมัครบัญชีนี้ คุณสามารถเพิกเฉยต่ออีเมลนี้ได้",
			Action:  "ยืนยันอีเมล",
		},
		"en": {
			Subject: "Verify your email",
			Body:    "Hello {{.DisplayName}},\n\nPlease verify your email to activate your account by clicking the button below (the link expires in 30 minutes):\n\n{{.ActionURL}}\n\nIf you did not create this account, you can safely ignore this email.",
			Action:  "Verify email",
		},
		"de": {
			Subject: "E-Mail-Adresse bestätigen",
			Body:    "Hallo {{.DisplayName}},\n\nbitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren, indem Sie auf die Schaltfläche unten klicken (der Link läuft in 30 Minuten ab):\n\n{{.ActionURL}}\n\nWenn Sie dieses Konto nicht erstellt haben, können Sie diese E-Mail ignorieren.",
			Action:  "E-Mail bestätigen",
		},
	},
	"link_approval": {
		"th": {
			Subject: "อนุมัติการเชื่อมต่อบัญชี Google",
			Body:    "สวัสดี {{.DisplayName}},\n\nมีผู้พยายามลงชื่อเข้าใช้ด้วยบัญชี Google ที่ใช้อีเมลนี้ กรุณาอนุมัติการเชื่อมต่อหากเป็นการกระทำของคุณ (ลิงก์มีอายุ 30 นาที):\n\n{{.ActionURL}}\n\nหากไม่ใช่คุณ คุณสามารถเพิกเฉยต่ออีเมลนี้ได้ และจะไม่มีการเปลี่ยนแปลงใด ๆ กับบัญชีของคุณ",
			Action:  "อนุมัติการเชื่อมต่อ",
		},
		"en": {
			Subject: "Approve linking your Google account",
			Body:    "Hello {{.DisplayName}},\n\nSomeone tried to sign in with a Google account using this email. Please approve the link if this was you (the link expires in 30 minutes):\n\n{{.ActionURL}}\n\nIf this was not you, you can safely ignore this email and no changes will be made to your account.",
			Action:  "Approve link",
		},
		"de": {
			Subject: "Verknüpfung mit Google-Konto genehmigen",
			Body:    "Hallo {{.DisplayName}},\n\njemand hat versucht, sich mit einem Google-Konto und dieser E-Mail-Adresse anzumelden. Bitte genehmigen Sie die Verknüpfung, wenn Sie das waren (der Link läuft in 30 Minuten ab):\n\n{{.ActionURL}}\n\nWenn Sie das nicht waren, können Sie diese E-Mail ignorieren; an Ihrem Konto wird nichts geändert.",
			Action:  "Verknüpfung genehmigen",
		},
	},
	"password_reset": {
		"th": {
			Subject: "รีเซ็ตรหัสผ่านของคุณ",
			Body:    "สวัสดี {{.DisplayName}},\n\nเราได้รับคำขอให้รีเซ็ตรหัสผ่านของคุณ คลิกที่ปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์มีอายุ 30 นาที):\n\n{{.ActionURL}}\n\nหากคุณไม่ได้ร้องขอ คุณสามารถเพิกเฉยต่ออีเมลนี้ได้",
			Action:  "รีเซ็ตรหัสผ่าน",
		},
		"en": {
			Subject: "Reset your password",
			Body:    "Hello {{.DisplayName}},\n\nWe received a request to reset your password. Click the button below to choose a new password (the link expires in 30 minutes):\n\n{{.ActionURL}}\n\nIf you did not request this, you can safely ignore this email.",
			Action:  "Reset password",
		},
		"de": {
			Subject: "Passwort zurücksetzen",
			Body:    "Hallo {{.DisplayName}},\n\nwir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten. Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu wählen (der Link läuft in 30 Minuten ab):\n\n{{.ActionURL}}\n\nWenn Sie das nicht angefordert haben, können Sie diese E-Mail ignorieren.",
			Action:  "Passwort zurücksetzen",
		},
	},
	"password_reset_google": {
		"th": {
			Subject: "รีเซ็ตรหัสผ่านสำหรับบัญชี Google",
			Body:    "สวัสดี {{.DisplayName}},\n\nบัญชีนี้ลงชื่อเข้าใช้ด้วย Google จึงไม่มีรหัสผ่านให้รีเซ็ต หากต้องการเข้าใช้งาน ให้ลงชื่อเข้าใช้ด้วย Google และไปที่ส่วนความปลอดภัยของบัญชีเพื่อเพิ่มรหัสผ่านสำรองได้ภายหลัง:\n\n{{.ActionURL}}\n\nหากคุณไม่ได้ร้องขอ คุณสามารถเพิกเฉยต่ออีเมลนี้ได้",
			Action:  "ลงชื่อเข้าใช้ด้วย Google",
		},
		"en": {
			Subject: "Password reset for your Google account",
			Body:    "Hello {{.DisplayName}},\n\nThis account signs in with Google, so there is no password to reset. Sign in with Google and open Account Security if you want to add a backup password later:\n\n{{.ActionURL}}\n\nIf you did not request this, you can safely ignore this email.",
			Action:  "Sign in with Google",
		},
		"de": {
			Subject: "Passwort zurücksetzen für Ihr Google-Konto",
			Body:    "Hallo {{.DisplayName}},\n\nDieses Konto meldet sich mit Google an, daher gibt es kein Passwort zum Zurücksetzen. Melden Sie sich mit Google an und öffnen Sie die Kontosicherheit, wenn Sie später ein Ersatzpasswort hinzufügen möchten:\n\n{{.ActionURL}}\n\nWenn Sie das nicht angefordert haben, können Sie diese E-Mail ignorieren.",
			Action:  "Mit Google anmelden",
		},
	},
	"password_changed": {
		"th": {
			Subject: "รหัสผ่านของคุณถูกเปลี่ยนแล้ว",
			Body:    "สวัสดี {{.DisplayName}},\n\nรหัสผ่านของบัญชีคุณถูกเปลี่ยนเรียบร้อยแล้ว และทุกเซสชันถูกยกเลิกเพื่อความปลอดภัย หากคุณไม่ได้ดำเนินการนี้ กรุณาติดต่อฝ่ายดูแลเว็บไซต์ทันที",
			Action:  "ลงชื่อเข้าใช้",
		},
		"en": {
			Subject: "Your password was changed",
			Body:    "Hello {{.DisplayName}},\n\nYour account password was changed and every session was signed out for your security. If you did not do this, please contact the website team immediately.",
			Action:  "Sign in",
		},
		"de": {
			Subject: "Ihr Passwort wurde geändert",
			Body:    "Hallo {{.DisplayName}},\n\nIhr Kontopasswort wurde geändert und alle Sitzungen wurden aus Sicherheitsgründen beendet. Wenn Sie das nicht waren, wenden Sie sich bitte sofort an das Website-Team.",
			Action:  "Anmelden",
		},
	},
	"session_revoked": {
		"th": {
			Subject: "ตรวจพบการใช้งานเซสชันที่น่าสงสัย",
			Body:    "สวัสดี {{.DisplayName}},\n\nเราตรวจพบว่ามีการใช้งานเซสชันที่ยกเลิกแล้วซึ่งบ่งชี้ว่ารหัสเปิดเซสชันของคุณอาจถูกขโมย เราจึงยกเลิกทุกเซสชันเพื่อความปลอดภัย กรุณาลงชื่อเข้าใช้อีกครั้งและรีเซ็ตรหัสผ่านหากจำเป็น",
			Action:  "ลงชื่อเข้าใช้",
		},
		"en": {
			Subject: "Suspicious session activity detected",
			Body:    "Hello {{.DisplayName}},\n\nWe detected use of a revoked session, which may indicate your session token was stolen. We signed out every session for your safety. Please sign in again and reset your password if necessary.",
			Action:  "Sign in",
		},
		"de": {
			Subject: "Verdächtige Sitzungsaktivität erkannt",
			Body:    "Hallo {{.DisplayName}},\n\nwir haben die Verwendung einer widerrufenen Sitzung festgestellt, was darauf hindeuten kann, dass Ihr Sitzungstoken gestohlen wurde. Aus Sicherheitsgründen haben wir alle Sitzungen beendet. Bitte melden Sie sich erneut an und setzen Sie Ihr Passwort bei Bedarf zurück.",
			Action:  "Anmelden",
		},
	},
	"change_email": {
		"th": {Subject: "ยืนยันการเปลี่ยนอีเมล", Body: "สวัสดี {{.DisplayName}},\n\nกรุณายืนยันอีเมลใหม่ของคุณภายใน 30 นาที:\n\n{{.ActionURL}}", Action: "ยืนยันอีเมลใหม่"},
		"en": {Subject: "Confirm your new email", Body: "Hello {{.DisplayName}},\n\nConfirm your new email address within 30 minutes:\n\n{{.ActionURL}}", Action: "Confirm email"},
		"de": {Subject: "Neue E-Mail-Adresse bestätigen", Body: "Hallo {{.DisplayName}},\n\nbestätigen Sie Ihre neue E-Mail-Adresse innerhalb von 30 Minuten:\n\n{{.ActionURL}}", Action: "E-Mail bestätigen"},
	},
	"email_changed": {
		"th": {Subject: "อีเมลบัญชีถูกเปลี่ยนแล้ว", Body: "สวัสดี {{.DisplayName}},\n\nอีเมลบัญชีของคุณถูกเปลี่ยนแล้ว หากไม่ใช่คุณ กรุณาติดต่อผู้ดูแลเว็บไซต์ทันที", Action: "เข้าสู่ระบบ"},
		"en": {Subject: "Your account email changed", Body: "Hello {{.DisplayName}},\n\nYour account email was changed. If you did not do this, contact the website team immediately.", Action: "Sign in"},
		"de": {Subject: "Ihre Konto-E-Mail wurde geändert", Body: "Hallo {{.DisplayName}},\n\nIhre Konto-E-Mail wurde geändert. Wenn Sie das nicht waren, wenden Sie sich sofort an das Website-Team.", Action: "Anmelden"},
	},
	"reopen_account": {
		"th": {Subject: "กู้คืนบัญชีของคุณ", Body: "สวัสดี {{.DisplayName}},\n\nคลิกลิงก์เพื่อกู้คืนบัญชีภายใน 30 วัน:\n\n{{.ActionURL}}", Action: "กู้คืนบัญชี"},
		"en": {Subject: "Restore your account", Body: "Hello {{.DisplayName}},\n\nClick the link to restore your account within 30 days:\n\n{{.ActionURL}}", Action: "Restore account"},
		"de": {Subject: "Konto wiederherstellen", Body: "Hallo {{.DisplayName}},\n\nklicken Sie innerhalb von 30 Tagen auf den Link, um Ihr Konto wiederherzustellen:\n\n{{.ActionURL}}", Action: "Konto wiederherstellen"},
	},
}

// RenderEmail renders the subject and plain-text body for a purpose and locale.
// Unknown locales and missing copy fall back to English.
func RenderEmail(purpose, locale string, vars EmailTemplateVar) (subject, body string, err error) {
	copySet, ok := emailCopy[purpose]
	if !ok {
		return "", "", fmt.Errorf("unknown email purpose %q", purpose)
	}
	fallback := copySet["en"]
	c, ok := copySet[SafeLocale(locale)]
	if !ok {
		c = fallback
	}
	if strings.TrimSpace(c.Subject) == "" || strings.TrimSpace(c.Body) == "" {
		return "", "", fmt.Errorf("incomplete email copy for purpose %q locale %q", purpose, locale)
	}

	subjectTmpl, err := template.New("subject").Parse(c.Subject)
	if err != nil {
		return "", "", err
	}
	bodyTmpl, err := template.New("body").Parse(c.Body)
	if err != nil {
		return "", "", err
	}

	var subjectBuf, bodyBuf strings.Builder
	if err := subjectTmpl.Execute(&subjectBuf, vars); err != nil {
		return "", "", err
	}
	if err := bodyTmpl.Execute(&bodyBuf, vars); err != nil {
		return "", "", err
	}
	return subjectBuf.String(), bodyBuf.String(), nil
}
