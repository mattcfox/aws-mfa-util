import { OptionValues } from 'commander';
import ConfigParser from 'configparser';

export const HELPER_MFA_KEY = 'helper_mfa_id';

export async function configure<T extends OptionValues>(options: T) {
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
