-- One-shot cleanup: remove the throwaway, never-confirmed auth user created to
-- verify the Resend SMTP pipeline (2026-07-21). Guarded by id AND email so it
-- can never touch anything else; cascades clear identities/sessions.
delete from auth.users
where id = '0c35dbeb-5dfb-40d9-b6d6-041feda67a60'
  and email = 'yitzih97+smtptest@gmail.com';
