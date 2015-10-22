package main

import (
  "net/http"
  "io"
  "os"
  "fmt"
  "encoding/json")

type WengerError struct {
  Error string
}

type WengerDownloadStatus struct {
  Percent int
}

func main() {
  if len(os.Args) < 2 {
    err("Missing command")
  }
  cmd := os.Args[1]

  switch cmd {
  case "dl":
    dl()
  default:
    err("Invalid command")
  }
}

func send(v interface{}) {
  j, _ := json.Marshal(v)
  fmt.Println(string(j))
}

func err(msg string) {
  e := &WengerError{
    Error: msg}
  send(e)
  os.Exit(1)
}

func dl() {
  if len(os.Args) < 4 {
    err("Missing url or dest for dl command")
  }
  url := os.Args[2]
  dest := os.Args[3]

  out, _ := os.Create(dest)
  defer out.Close()

  resp, _ := http.Get(url)
  defer resp.Body.Close()

  bytesWritten := int64(0)

  for {
    n, _ := io.CopyN(out, resp.Body, 1024 * 1024)
    bytesWritten += n

    status := &WengerDownloadStatus{
      Percent: int(bytesWritten * 100 / resp.ContentLength)}
    send(status)

    if n == 0 { break }
  }
}
