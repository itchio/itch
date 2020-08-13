package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/logrusorgru/aurora"
)

type ItchLogLine struct {
	Time  int64  `json:"time"`
	Level int    `json:"level"`
	Msg   string `json:"msg"`
	Name  string `json:"name"`
}

func (line *ItchLogLine) String() string {
	timestamp := time.Unix(line.Time/1000, 0)

	res := aurora.Sprintf(aurora.Gray(5, "%s "), timestamp.Format("15:04:05.000"))

	switch line.Level {
	case 60:
		res += aurora.Sprintf(aurora.BgRed("%s"), "FATAL")
	case 50:
		res += aurora.Sprintf(aurora.Red("%s"), "ERROR")
	case 40:
		res += aurora.Sprintf(aurora.Yellow("%s"), "WARN")
	case 30:
		res += aurora.Sprintf(aurora.Green("%s"), "INFO")
	case 20:
		res += aurora.Sprintf(aurora.Blue("%s"), "DEBUG")
	default:
		res += aurora.Sprintf(aurora.Gray(5, "%s"), "TRACE")
	}
	if line.Name != "" {
		res += fmt.Sprintf(" (%s)", line.Name)
	}

	res += fmt.Sprintf(" %s", line.Msg)
	return res
}

func parseLogLine(text string) (*ItchLogLine, error) {
	var line ItchLogLine

	err := json.Unmarshal([]byte(text), &line)
	if err != nil {
		return nil, err
	}

	return &line, err
}
