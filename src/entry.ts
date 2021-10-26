#!/usr/bin/env node
import { homedir } from 'os';
import { join } from 'path';

import { Command } from 'commander';

import { auth } from './auth';
import { configure } from './configure';
import * as packageJson from '../package.json';

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
