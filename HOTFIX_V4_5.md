# HOTFIX V4.5 — UUID empty value on Admin save

Fixes `invalid input syntax for type uuid: ""` when saving forms that contain optional R2/media or relation fields with no selection.

Cause: browser form values use an empty string for an unselected field, while PostgreSQL UUID/FK columns require `NULL`.

Changed file:
- `admin/src/components/TableManager.jsx`

No database migration is required.
