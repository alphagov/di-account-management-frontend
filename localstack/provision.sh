#!/bin/sh

# If you don't have a test profile make one
# aws configure set aws_access_key_id "dummy" --profile test-profile
# aws configure set aws_secret_access_key "dummy" --profile test-profile
# aws configure set region "eu-west-2" --profile test-profile

export TABLE_NAME=user_services
export TABLE_SCHEMA_SEED=user_services_table_seed.json
export AWS_PROFILE=test-profile
export BUILD_CLIENT_ID=nXx0aoWYfQr13mhQ1Kr9WLAOR7WMQZFmRT4-Yoq7Uw0

aws --endpoint-url=http://localhost:4566 dynamodb create-table \
    --cli-input-json "$(cat  ./$TABLE_SCHEMA_SEED)" \
    --profile $AWS_PROFILE \
    --region eu-west-2 \
  | cat

aws --endpoint-url=http://localhost:4566 dynamodb describe-table \
    --table-name $TABLE_NAME \
    --region eu-west-2 \
    --profile $AWS_PROFILE

aws --endpoint-url=http://localhost:4566 dynamodb put-item \
    --table-name $TABLE_NAME  \
    --region eu-west-2 \
    --profile $AWS_PROFILE \
    --item \
        "{\"user_id\":{\"S\": \"$BUILD_CLIENT_ID\"}, \"services\": {\"L\":[{\"M\":{\"count_successful_logins\":{\"N\":\"2\"},\"client_id\":{\"S\":\"client_id_1\"},\"last_accessed\":{\"N\":\"1666169856\"}}}]}}"

aws --endpoint-url=http://localhost:4566 dynamodb get-item \
    --table-name $TABLE_NAME  \
    --region eu-west-2 \
    --profile $AWS_PROFILE \
    --key \
        "{\"user_id\":{\"S\": \"$BUILD_CLIENT_ID\"}}"
