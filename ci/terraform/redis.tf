locals {
  redis_port_number = 6379
}

data "cloudfoundry_service" "redis" {
  name = "redis"
}

resource "cloudfoundry_service_instance" "redis" {
  name         = "${var.environment}-redis"
  space        = data.cloudfoundry_space.space.id
  service_plan = data.cloudfoundry_service.redis.service_plans["${var.redis_service_plan}"]
}

resource "aws_elasticache_subnet_group" "account_management_redis_session_store" {
  name       = "${var.environment}-acct-mgmt-redis-frontend-cache-subnet"
  subnet_ids = local.private_subnet_ids

  tags = local.default_tags
}


resource "random_password" "redis_password" {
  length = 32

  override_special = "!&#$^<>-"
  min_lower        = 3
  min_numeric      = 3
  min_special      = 3
  min_upper        = 3
}

resource "aws_elasticache_replication_group" "account_management_sessions_store" {
  automatic_failover_enabled    = true
  availability_zones            = data.aws_availability_zones.available.names
  replication_group_id          = "${var.environment}-acct-mgmt-frontend-cache"
  replication_group_description = "A Redis cluster for storing user session data for the account management frontend"
  node_type                     = var.redis_node_size
  number_cache_clusters         = length(data.aws_availability_zones.available.names)
  engine                        = "redis"
  engine_version                = "6.x"
  parameter_group_name          = "default.redis6.x"
  port                          = local.redis_port_number
  maintenance_window            = "mon:02:00-mon:03:00"
  notification_topic_arn        = data.aws_sns_topic.slack_events.arn

  multi_az_enabled = true

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_password.result
  apply_immediately          = true

  subnet_group_name = aws_elasticache_subnet_group.account_management_redis_session_store.name
  security_group_ids = [
    aws_security_group.am_frontend_redis_security_group.id
  ]

  lifecycle {
    ignore_changes = [
      engine_version
    ]
  }

  tags = local.default_tags
}