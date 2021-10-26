# aws-mfa

This is a simple utility inspired by [broamski/aws-mfa](https://github.com/broamski/aws-mfa) to help manage MFA authentication to AWS, when using the API. It will replace the credentials tied to a profile with temporary credentials with MFA. Those can then be used normally with the profile until they expire.

## Usage

### Auth

```
Usage: aws-mfa auth [options]

Authenticate via MFA

Options:
  -c, --credentialsFile <credentials-path>  Credentials file to use (default: "/home/matt/.aws/credentials")
  -d, --device <arn/id>                     ARN or ID for MFA device
  -p, --profile <profile>                   AWS profile to use (default: "default")
  -t, --token <token>                       Required: Token from your MFA device
  -h, --help                                display help for command
```

The device flag may be omitted, if you have configured the profile with the device via the `configure` command.
Long lived credentials will be moved to a `<profile-no-mfa>` profile in the credentials file. The profile targeted will be modified to have temporary credentials with MFA.

### Configure

```
Usage: aws-mfa configure [options]

Configure a MFA device

Options:
  -c, --credentialsFile <credentials-path>  Credentials file to use (default: "/home/matt/.aws/credentials")
  -d, --device <serial-number>              Required: Serial number for MFA device
  -p, --profile <profile>                   AWS profile to use (default: "default")
  -h, --help                                display help for command
```

This command will add a `helper_mfa_id` value to the profile in the credentials file. This allows the utility to auth without passing in the device.

## Development

Pretty simple at the moment:
Use `yarn` for package management.
Run eslint and prettier via the `yarn format` and `yarn lint` commands.
