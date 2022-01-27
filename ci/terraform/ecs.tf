resource "random_string" "session_secret" {
  length = 32
  special = false
}

resource "aws_ecs_service" "account_management_ecs_service" {
  name            = "${var.environment}-account-management-ecs-service"
  cluster         = local.cluster_id
  task_definition = aws_ecs_task_definition.account_management_task_definition.arn
  desired_count   = var.account_management_ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [
      local.allow_egress_security_group_id,
      local.allow_aws_service_access_security_group_id,
      aws_security_group.account_management_ecs_tasks_sg.id,
      aws_security_group.allow_access_to_am_frontend_redis.id,
    ]
    subnets          = local.private_subnet_ids
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.account_management_alb_target_group.arn
    container_name   = "${var.environment}-account-management-ecs-task-definition-container"
    container_port   = var.account_management_app_port
  }

}

resource "aws_ecs_task_definition" "account_management_task_definition" {
  family                   = "${var.environment}-account-management-ecs-task-definition"
  execution_role_arn       = aws_iam_role.account_management_ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.account_management_ecs_task_role.arn
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 1024
  memory                   = 2048
  container_definitions = jsonencode([
    {
      name      = "${var.environment}-account-management-ecs-task-definition-container"
      image     = "${var.account_management_image_uri}:${var.account_management_image_tag}@${var.account_management_image_digest}"
      essential = true
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "${var.environment}-account-management-ecs-log-group"
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "${var.environment}-account-management-ecs-log-stream"
        }
      }
      portMappings = [
        {
          protocol      = "tcp"
          containerPort = var.account_management_app_port
          hostPort      = var.account_management_app_port
      }]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "APP_ENV"
          value = var.environment
        },
        {
          name  = "FARGATE"
          value = "1"
        },
        {
          name  = "API_BASE_URL"
          value = "https://${local.oidc_api_fqdn}"
        },
        {
          name  = "AM_API_BASE_URL"
          value = "https://${local.account_management_api_fqdn}"
        },
        {
          name  = "BASE_URL"
          value = aws_route53_record.account_management_fg.name
        },
        {
          name  = "OIDC_CLIENT_ID"
          value = random_string.account_management_client_id.result
        },
        {
          name  = "OIDC_CLIENT_SCOPES"
          value = join(" ", local.scopes)
        },
        {
          name  = "SESSION_EXPIRY"
          value = var.session_expiry
        },
        {
          name  = "SESSION_SECRET"
          value = random_string.session_secret.result
        },
        {
          name  = "AM_YOUR_ACCOUNT_URL"
          value = var.your_account_url
        },
        {
          name  = "GTM_ID"
          value = var.gtm_id
        },
        {
          name  = "GOV_ACCOUNTS_PUBLISHING_API_URL"
          value = var.gov_accounts_publishing_api_url
        },
        {
          name  = "GOV_ACCOUNTS_PUBLISHING_API_TOKEN"
          value = var.gov_account_publishing_api_token
        },
        {
          name  = "AUTH_FRONTEND_URL"
          value = local.frontend_fqdn
        },
        {
          name  = "ANALYTICS_COOKIE_DOMAIN"
          value = local.service_domain
        },
        {
          name  = "COOKIES_AND_FEEDBACK_URL"
          value = var.cookies_and_feedback_url
        },
        {
          name  = "REDIS_KEY"
          value = local.redis_key
        },
        {
          name  = "KMS_KEY_ID"
          value = aws_kms_key.account_management_jwt_key.id
        },
      ]
  }])
}

resource "aws_cloudwatch_log_group" "account_management-ecs-log-group" {
  name = "${var.environment}-account-management-ecs-log-group"

  retention_in_days = 1
}