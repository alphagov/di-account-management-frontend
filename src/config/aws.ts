import { Endpoint } from "aws-sdk";
import { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import {
  getAppEnv,
  getAwsRegion,
  getKmsKeyId,
  getLocalStackBaseUrl,
} from "../config";
import { SQSClientConfig } from "@aws-sdk/client-sqs";

//refer to seed.yaml
const LOCAL_KEY_ID = "ff275b92-0def-4dfc-b0f6-87c96b26c6c7";

export interface KmsConfig {
  awsConfig: AwsConfig;
  kmsKeyId: string;
}

export interface SnsConfig {
  awsConfig: AwsConfig;
}

export interface SqsConfig {
  awsConfig: AwsConfig;
  sqsClientConfig: SQSClientConfig;
}

export interface AwsConfig {
  endpoint?: Endpoint;
  accessKeyId?: string;
  secretAccessKey?: string;
  region: string;
}

function getLocalStackKmsConfig() {
  return {
    awsConfig: { ...getLocalStackAWSConfig() },
    kmsKeyId: LOCAL_KEY_ID,
  };
}

function getLocalStackAWSConfig(): AwsConfig {
  return {
    endpoint: new Endpoint(getLocalStackBaseUrl()),
    accessKeyId: "na",
    secretAccessKey: "na",
    region: getAwsRegion(),
  };
}

export function getSNSConfig(): SnsConfig {
  if (getAppEnv() === "local") {
    return {
      awsConfig: { ...getLocalStackAWSConfig() },
    };
  }

  return {
    awsConfig: {
      region: getAwsRegion(),
    },
  };
}

export function getSQSConfig(): SqsConfig {
  if (getAppEnv() === "local") {
    return {
      awsConfig: { ...getLocalStackAWSConfig() },
      sqsClientConfig: {
        region: getAwsRegion(),
        endpoint: "http://localstack:4566",  // NOSONAR: http used locally
        credentials: {
          accessKeyId: "na",
          secretAccessKey: "na",
        }
      },
    };
  }

  return {
    awsConfig: {
      region: getAwsRegion(),
    },
    sqsClientConfig: {
      region: getAwsRegion(),
    },
  };
}

export function getAWSConfig(): AwsConfig {
  if (getAppEnv() === "local") {
    return getLocalStackAWSConfig();
  }

  return {
    region: getAwsRegion(),
  };
}

export function getKMSConfig(): KmsConfig {
  if (getAppEnv() === "local") {
    return getLocalStackKmsConfig();
  }

  return {
    awsConfig: {
      region: getAwsRegion(),
    },
    kmsKeyId: getKmsKeyId(),
  };
}

export function getDBConfig(
  config: AwsConfig = getAWSConfig()
): DynamoDBClientConfig {
  const dbConfig: any = {};

  if (config.accessKeyId || config.secretAccessKey) {
    dbConfig.credentials = {
      accessKeyId: config.accessKeyId || "",
      secretAccessKey: config.secretAccessKey || "",
    };
  }

  if (config.endpoint) {
    dbConfig.endpoint = `${config.endpoint.protocol}//${config.endpoint.host}`;
  }

  if (config.region) {
    dbConfig.region = config.region;
  }

  return dbConfig;
}
