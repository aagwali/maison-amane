// src/application/pilot/commands/index.ts

export {
  makePilotProductCreationCommand,
  type PilotProductCreationCommand,
  type UnvalidatedProductData,
} from './create-pilot-product.command'

export {
  makePilotProductUpdateCommand,
  type PilotProductUpdateCommand,
  type UnvalidatedUpdateData,
} from './update-pilot-product.command'
