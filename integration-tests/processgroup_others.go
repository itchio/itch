//+build !windows

package main

func SetupProcessGroup() error {
	// nothing to do on non-windows platforms
	return nil
}
