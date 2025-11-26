export const environments = {
  dev: {
    name: 'Development',
    database: 'dev',
    user: 'dave_dev',
    host: 'agents.c8nqsqmsoz7n.us-east-1.rds.amazonaws.com',
    port: 5432,
    color: 'green',
  },
  stage: {
    name: 'Staging',
    database: 'stage',
    user: 'dave_stage',
    host: 'agents.c8nqsqmsoz7n.us-east-1.rds.amazonaws.com',
    port: 5432,
    color: 'yellow',
  },
  prod: {
    name: 'Production',
    database: 'prod',
    user: 'dave_prod',
    host: 'agents.c8nqsqmsoz7n.us-east-1.rds.amazonaws.com',
    port: 5432,
    color: 'red',
  },
} as const;

export type Environment = keyof typeof environments;

