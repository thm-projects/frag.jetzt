import { verifyInstance } from 'app/utils/ts-utils';

export class GPTModelPermission {
  id: string;
  object: string;
  created: Date;
  allowCreateEngine: boolean;
  allowSampling: boolean;
  allowLogprobs: boolean;
  allowSearchIndices: boolean;
  allowView: boolean;
  allowFineTuning: boolean;
  organization: string;
  group: string;
  isBlocking: boolean;

  constructor({
    id = null,
    object = null,
    created = null,
    allowCreateEngine = null,
    allowSampling = null,
    allowLogprobs = null,
    allowSearchIndices = null,
    allowView = null,
    allowFineTuning = null,
    organization = null,
    group = null,
    isBlocking = null,
  }: GPTModelPermission) {
    this.id = id;
    this.object = object;
    this.created = created ? new Date(created) : null;
    this.allowCreateEngine = allowCreateEngine;
    this.allowSampling = allowSampling;
    this.allowLogprobs = allowLogprobs;
    this.allowSearchIndices = allowSearchIndices;
    this.allowView = allowView;
    this.allowFineTuning = allowFineTuning;
    this.organization = organization;
    this.group = group;
    this.isBlocking = isBlocking;
  }
}

export class GPTModel {
  id: string;
  created: Date;
  object: string;
  ownedBy: string;
  permission: GPTModelPermission[];
  root: string;
  parent: string;

  constructor({
    id = null,
    created = null,
    object = null,
    ownedBy = null,
    permission = [],
    root = null,
    parent = null,
  }: GPTModel) {
    this.id = id;
    this.created = created ? new Date(created) : null;
    this.object = object;
    this.ownedBy = ownedBy;
    this.permission = permission.map((e) =>
      verifyInstance(GPTModelPermission, e),
    );
    this.root = root;
    this.parent = parent;
  }
}

export class GPTModels {
  object: string;
  data: GPTModel[];

  constructor({ object = null, data = [] }: GPTModels) {
    this.object = object;
    this.data = data.map((e) => verifyInstance(GPTModel, e));
  }
}
