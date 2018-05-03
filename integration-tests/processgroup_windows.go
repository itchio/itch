//+build windows

package main

import (
	"syscall"
	"unsafe"

	"github.com/itchio/ox/syscallex"
	"github.com/pkg/errors"
)

func SetupProcessGroup() error {
	// see https://github.com/itchio/itch/issues/1784
	jobObject, err := syscallex.CreateJobObject(nil, nil)
	if err != nil {
		return errors.WithMessage(err, "While creating job object")
	}

	jobObjectInfo := new(syscallex.JobObjectExtendedLimitInformation)
	jobObjectInfo.BasicLimitInformation.LimitFlags = syscallex.JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
	jobObjectInfoPtr := uintptr(unsafe.Pointer(jobObjectInfo))
	jobObjectInfoSize := unsafe.Sizeof(*jobObjectInfo)

	err = syscallex.SetInformationJobObject(
		jobObject,
		syscallex.JobObjectInfoClass_JobObjectExtendedLimitInformation,
		jobObjectInfoPtr,
		jobObjectInfoSize,
	)
	if err != nil {
		return errors.WithMessage(err, "Setting KILL_ON_JOB_CLOSE")
	}

	processHandle, err := syscall.GetCurrentProcess()
	if err != nil {
		return errors.WithMessage(err, "Getting current process handle")
	}

	err = syscallex.AssignProcessToJobObject(jobObject, processHandle)
	if err != nil {
		return errors.WithMessage(err, "While associating process with job object")
	}

	return nil
}
