/*
# Lock down internal trigger functions from direct RPC calls

1. Security changes
- REVOKE EXECUTE on the trigger helper functions (handle_new_auth_user,
  notify_new_order, notify_new_message) and the is_admin() helper from PUBLIC,
  anon and authenticated. These run internally via triggers/policies; they were
  left callable by default Postgres grants and the security advisor flagged them.
- create_order and get_my_orders remain intentionally public: they are the
  checkout and order-history endpoints, validated server-side.

2. Notes
- Trigger functions do not need EXECUTE privileges for triggers to fire.
- No table, policy or data changes.
*/

REVOKE EXECUTE ON FUNCTION handle_new_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION notify_new_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION notify_new_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC, anon, authenticated;
