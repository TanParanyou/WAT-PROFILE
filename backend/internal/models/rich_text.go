package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type LocalizedRichText map[string]json.RawMessage

func (m LocalizedRichText) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	bytes, err := json.Marshal(m)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

func (m *LocalizedRichText) Scan(value any) error {
	if value == nil {
		*m = nil
		return nil
	}
	var bytes []byte
	switch typed := value.(type) {
	case []byte:
		bytes = typed
	case string:
		bytes = []byte(typed)
	default:
		return errors.New("unsupported type for LocalizedRichText")
	}
	if len(bytes) == 0 {
		*m = LocalizedRichText{}
		return nil
	}
	var result map[string]json.RawMessage
	if err := json.Unmarshal(bytes, &result); err != nil {
		return err
	}
	*m = LocalizedRichText(result)
	return nil
}

func (m *LocalizedRichText) UnmarshalJSON(data []byte) error {
	var result map[string]json.RawMessage
	if err := json.Unmarshal(data, &result); err != nil {
		return err
	}
	*m = LocalizedRichText(result)
	return nil
}

func (m LocalizedRichText) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]json.RawMessage(m))
}
