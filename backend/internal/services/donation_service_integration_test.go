package services

import (
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func testDonationDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST is not configured")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.Member{}, &models.DonationCategory{}, &models.Donation{}); err != nil {
		t.Fatalf("migrate donation models: %v", err)
	}
	return db
}

func TestListForMemberScopesByAuthenticatedUser(t *testing.T) {
	db := testDonationDB(t)
	userA, userB := uuid.New(), uuid.New()
	if err := db.Create(&[]models.User{{ID: userA, Email: "donation-test-" + uuid.NewString() + "@example.invalid", Name: "Donation Test A"}, {ID: userB, Email: "donation-test-" + uuid.NewString() + "@example.invalid", Name: "Donation Test B"}}).Error; err != nil {
		t.Fatal(err)
	}
	defer db.Where("id IN ?", []uuid.UUID{userA, userB}).Delete(&models.User{})
	memberA := models.Member{UserID: &userA, MemberCode: "TEST-A-" + uuid.NewString()[:8]}
	memberB := models.Member{UserID: &userB, MemberCode: "TEST-B-" + uuid.NewString()[:8]}
	if err := db.Create(&memberA).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&memberB).Error; err != nil {
		t.Fatal(err)
	}
	defer db.Where("id IN ?", []int{memberA.ID, memberB.ID}).Delete(&models.Member{})

	donations := []models.Donation{
		{ReceiptNumber: fmt.Sprintf("TEST-%s", uuid.NewString()), DonorType: "member", MemberID: &memberA.ID, Amount: 10, Currency: "EUR", DonationDate: time.Now(), Status: "confirmed"},
		{ReceiptNumber: fmt.Sprintf("TEST-%s", uuid.NewString()), DonorType: "member", MemberID: &memberB.ID, Amount: 20, Currency: "EUR", DonationDate: time.Now(), Status: "confirmed"},
	}
	if err := db.Create(&donations).Error; err != nil {
		t.Fatal(err)
	}
	defer db.Where("id IN ?", []int{donations[0].ID, donations[1].ID}).Delete(&models.Donation{})

	items, total, err := NewDonationService(db).ListForMember(userA, listquery.Common{Page: 1, Limit: 10, Sort: "donation_date", Order: "desc"})
	if err != nil {
		t.Fatal(err)
	}
	if total != 1 || len(items) != 1 || items[0].MemberID == nil || *items[0].MemberID != memberA.ID {
		t.Fatalf("expected only member A donation, total=%d items=%+v", total, items)
	}
}

func TestListDonationsOptionsWithSearchAndSort(t *testing.T) {
	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST is not configured")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	svc := NewDonationService(db)
	donations, total, err := svc.ListDonationsOptions(DonationListOptions{
		Common: listquery.Common{
			Page:   1,
			Limit:  25,
			Search: "01",
			Sort:   "created_at",
			Order:  "desc",
		},
	})
	if err != nil {
		t.Fatalf("ListDonationsOptions failed: %v", err)
	}
	t.Logf("Found %d total, returned %d donations", total, len(donations))
}
