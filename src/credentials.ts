import ConfigParser from 'configparser';

export function writeCredentialsToProfile(
  credentials: ConfigParser,
  profile: string,
  accessKeyId: string,
  secretAccessKey: string,
  sessionToken?: string,
) {
  if (!credentials.sections().includes(profile)) {
    credentials.addSection(profile);
  }

  credentials.set(profile, 'aws_access_key_id', accessKeyId);
  credentials.set(profile, 'aws_secret_access_key', secretAccessKey);
  if (sessionToken) {
    credentials.set(profile, 'aws_session_token', sessionToken);
  }
}

export function getCredentialsFromProfile(
  credentials: ConfigParser,
  profile: string,
) {
  const accessKeyId = credentials.get(profile, 'aws_access_key_id');
  const secretAccessKey = credentials.get(profile, 'aws_secret_access_key');

  if (!(accessKeyId && secretAccessKey)) {
    console.error(
      `Error: access_key_id or secret_access_key missing from ${profile}`,
    );
    process.exit(1);
  }

  return {
    accessKeyId,
    secretAccessKey,
    sessionToken: credentials.get(profile, 'aws_session_token'),
  };
}
