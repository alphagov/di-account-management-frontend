environment         = "integration"
your_account_url    = "https://www.integration.publishing.service.gov.uk/account/home"
common_state_bucket = "digital-identity-dev-tfstate"

account_management_auto_scaling_enabled = false
account_management_ecs_desired_count    = 0

support_language_cy = "1"

logging_endpoint_arns = [
  "arn:aws:logs:eu-west-2:885513274347:destination:csls_cw_logs_destination_prodpython"
]

account_management_redirect_url = "https://home.integration.account.gov.uk"
