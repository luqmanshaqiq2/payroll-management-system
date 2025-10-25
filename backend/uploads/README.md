# Uploads Directory

This directory contains uploaded files for the Payroll Management System.

## Structure

- `profiles/` - Admin profile photos

## Security Notes

- All uploaded files are validated for type and size
- Profile photos are limited to 2MB and image files only
- Old photos are automatically deleted when new ones are uploaded
- Files are served statically through the Express server

## File Naming

Profile photos are named with the pattern: `profile-{timestamp}-{random}.{extension}`
