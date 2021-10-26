import { STSClient, GetSessionTokenCommand } from '@aws-sdk/client-sts';
import { OptionValues } from 'commander';
import ConfigParser from 'configparser';

import { HELPER_MFA_KEY } from './configure';
import {
  getCredentialsFromProfile,
  writeCredentialsToProfile,
} from './credentials';

export async function auth<T extends OptionValues>(options: T) {
  const NO_MFA_SUFFIX = '-no-mfa';

  const credentialsPath: string = options.credentialsFile;
  const credentials = new ConfigParser();
  await credentials.readAsync(credentialsPath);

  const profile: string = options.profile;
  const noMfaProfile = profile + NO_MFA_SUFFIX;

  if (!credentials.sections().includes(profile)) {
    console.error(`Error: No profile ${profile} in ${credentialsPath}`);
    process.exit(1);
  }

  const deviceId = credentials.get(profile, HELPER_MFA_KEY);

  if (!deviceId) {
    console.error(`Error: No device id in ${profile}`);
    process.exit(1);
  }

  let noMfaCreds = null;

  if (!credentials.sections().includes(noMfaProfile)) {
    noMfaCreds = getCredentialsFromProfile(credentials, profile);
    writeCredentialsToProfile(
      credentials,
      noMfaProfile,
      noMfaCreds.accessKeyId,
      noMfaCreds.secretAccessKey,
    );
  } else {
    noMfaCreds = getCredentialsFromProfile(credentials, noMfaProfile);
  }

  const client = new STSClient({
    credentials: noMfaCreds,
    region: 'us-east-1',
  });

  const command = new GetSessionTokenCommand({
    SerialNumber: deviceId,
    TokenCode: options.token,
  });

  const response = await client.send(command);

  writeCredentialsToProfile(
    credentials,
    profile,
    response.Credentials!.AccessKeyId!,
    response.Credentials!.SecretAccessKey!,
    response.Credentials!.SessionToken!,
  );

  await credentials.writeAsync(credentialsPath);
}
