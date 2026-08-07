package services

import (
	"context"
	"crypto/sha256"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

// PrivateObjectReader is the small storage contract needed by background
// receipt delivery. Keeping it here avoids coupling workers to HTTP handlers.
type PrivateObjectReader interface {
	OpenPrivate(context.Context, string) (io.ReadCloser, error)
}

// OperationDispatcher maps durable outbox jobs to domain operations. Every
// handler is idempotent: a successful job can be safely claimed again after a
// worker crash without creating a second donation or receipt record.
type OperationDispatcher struct {
	donations *DonationService
	emails    *DonationEmailService
	store     PrivateObjectReader
	media     *MediaRetentionService
}

func NewOperationDispatcher(donations *DonationService, emails *DonationEmailService, store PrivateObjectReader, media *MediaRetentionService) *OperationDispatcher {
	return &OperationDispatcher{donations: donations, emails: emails, store: store, media: media}
}

func (d *OperationDispatcher) Dispatch(ctx context.Context, job models.OperationOutbox) error {
	switch job.Kind {
	case "donation.acknowledgement":
		return d.dispatchDonationAcknowledgement(ctx, job)
	case "donation.receipt":
		return d.dispatchDonationReceipt(ctx, job)
	case "media.purge_due":
		if d.media == nil {
			return fmt.Errorf("media retention service is not configured")
		}
		_, err := d.media.PurgeDue(ctx)
		return err
	default:
		return fmt.Errorf("unsupported outbox job kind %q", job.Kind)
	}
}

func (d *OperationDispatcher) dispatchDonationAcknowledgement(ctx context.Context, job models.OperationOutbox) error {
	if d.donations == nil || d.emails == nil {
		return fmt.Errorf("donation acknowledgement dependencies are not configured")
	}
	id, err := outboxDonationID(job)
	if err != nil {
		return err
	}
	donation, err := d.donations.GetByID(id)
	if err != nil {
		return err
	}
	return d.emails.SendAcknowledgement(ctx, donation)
}

func (d *OperationDispatcher) dispatchDonationReceipt(ctx context.Context, job models.OperationOutbox) error {
	if d.donations == nil || d.emails == nil || d.store == nil {
		return fmt.Errorf("donation receipt dependencies are not configured")
	}
	id, err := outboxDonationID(job)
	if err != nil {
		return err
	}
	donation, err := d.donations.GetByID(id)
	if err != nil {
		return err
	}
	if donation.ReceiptDispatchedAt != nil {
		return nil
	}
	if donation.Status != "confirmed" || !donation.ReceiptRequested || strings.TrimSpace(donation.DonorEmail) == "" {
		return fmt.Errorf("donation is no longer eligible for receipt dispatch")
	}
	objectKey := donation.ReceiptObjectKey
	if objectKey == "" {
		objectKey, _ = outboxPayloadString(job, "object_key")
	}
	if objectKey == "" {
		return fmt.Errorf("receipt object key is missing")
	}
	actorID, err := outboxPayloadUUID(job, "actor_id")
	if err != nil {
		return err
	}
	checksum, _ := outboxPayloadString(job, "checksum")
	if checksum == "" {
		checksum = donation.ReceiptChecksum
	}
	body, err := d.store.OpenPrivate(ctx, objectKey)
	if err != nil {
		return err
	}
	pdf, readErr := io.ReadAll(io.LimitReader(body, 20*1024*1024+1))
	closeErr := body.Close()
	if readErr != nil {
		return readErr
	}
	if closeErr != nil {
		return closeErr
	}
	if len(pdf) > 20*1024*1024 {
		return fmt.Errorf("receipt exceeds 20 MB")
	}
	if checksum != "" {
		digest := fmt.Sprintf("%x", sha256.Sum256(pdf))
		if digest != checksum {
			return fmt.Errorf("receipt checksum does not match persisted document")
		}
	}
	if err := d.emails.SendReceipt(ctx, donation, pdf); err != nil {
		return err
	}
	_, _, err = d.donations.MarkReceiptDispatched(id, actorID, objectKey, checksum)
	return err
}

func outboxDonationID(job models.OperationOutbox) (int, error) {
	if job.AggregateID == "" {
		return 0, fmt.Errorf("outbox donation id is missing")
	}
	id, err := strconv.Atoi(job.AggregateID)
	if err != nil || id <= 0 {
		return 0, fmt.Errorf("invalid outbox donation id %q", job.AggregateID)
	}
	return id, nil
}

func outboxPayloadString(job models.OperationOutbox, key string) (string, bool) {
	value, ok := job.Payload[key]
	if !ok {
		return "", false
	}
	text, ok := value.(string)
	return text, ok && text != ""
}

func outboxPayloadUUID(job models.OperationOutbox, key string) (uuid.UUID, error) {
	value, ok := outboxPayloadString(job, key)
	if !ok {
		return uuid.Nil, fmt.Errorf("outbox payload %q is missing", key)
	}
	id, err := uuid.Parse(value)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid outbox payload %q", key)
	}
	return id, nil
}
