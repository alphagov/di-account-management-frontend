environment         = "integration"
your_account_url    = "https://www.integration.publishing.service.gov.uk/account/home"
common_state_bucket = "digital-identity-dev-tfstate"

account_management_auto_scaling_enabled = true

logging_endpoint_arns = [
  "arn:aws:logs:eu-west-2:885513274347:destination:csls_cw_logs_destination_prod",
  "arn:aws:logs:eu-west-2:885513274347:destination:csls_cw_logs_destination_prodpython"
]