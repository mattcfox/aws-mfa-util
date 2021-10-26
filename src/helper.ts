#!/usr/bin/env node
import { homedir } from 'os';
import { join } from 'path';
import { STSClient, GetSessionTokenCommand } from '@aws-sdk/client-sts';

import { Command, OptionValues } from 'commander';
import ConfigParser from 'configparser';

import * as packageJson from '../package.json';

const HELPER_MFA_KEY = 'helper_mfa_id';

async function configure<T extends OptionValues>(options: T) {
  const credentialsPath: string = options.credentialsFile;
  const credentials = new ConfigParser();
  await credentials.readAsync(credentialsPath);

  const profile: string = options.profile;

  if (!credentials.sections().includes(profile)) {
    console.error(`Error: No profile ${profile} in ${credentialsPath}`);
    process.exit(1);
  }

  credentials.set(profile, HELPER_MFA_KEY, options.device);

  await credentials.writeAsync(credentialsPath);

  console.log(`Successfully wrote device id to ${profile}`);
}

async function auth<T extends OptionValues>(options: T) {
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

function writeCredentialsToProfile(
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

function getCredentialsFromProfile(credentials: ConfigParser, profile: string) {
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

const program = new Command();
program.version(packageJson.version);

program
  .command('auth')
  .description('Authenticate via MFA')
  .option(
    '-c, --credentialsFile <credentials-path>',
    'Credentials file to use',
    process.env.AWS_SHARED_CREDENTIALS_FILE ??
      join(homedir(), '.aws', 'credentials'),
  )
  .option('-d, --device <arn/id>', 'ARN or ID for MFA device')
  .option(
    '-p, --profile <profile>',
    'AWS profile to use',
    process.env.AWS_PROFILE ?? 'default',
  )
  .requiredOption('-t, --token <token>', 'Required: Token from your MFA device')
  .action(auth);

program
  .command('configure')
  .description('Configure a MFA device')
  .option(
    '-c, --credentialsFile <credentials-path>',
    'Credentials file to use',
    process.env.AWS_SHARED_CREDENTIALS_FILE ??
      join(homedir(), '.aws', 'credentials'),
  )
  .requiredOption(
    '-d, --device <serial-number>',
    'Required: Serial number for MFA device',
  )
  .option(
    '-p, --profile <profile>',
    'AWS profile to use',
    process.env.AWS_PROFILE ?? 'default',
  )
  .action(configure);

program.parse();
