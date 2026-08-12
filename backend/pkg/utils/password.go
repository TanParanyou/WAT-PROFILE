package utils

import "golang.org/x/crypto/bcrypt"

const AdminPasswordCost = 12

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// HashAdminPassword hashes a password for admin users using a higher cost factor
func HashAdminPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), AdminPasswordCost)
	return string(bytes), err
}

// CheckPasswordHash compares a password with a hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// NeedsPasswordRehash checks if the existing password hash uses a lower cost factor than targetCost
func NeedsPasswordRehash(hash string, targetCost int) bool {
	cost, err := bcrypt.Cost([]byte(hash))
	if err != nil {
		return false
	}
	return cost < targetCost
}

