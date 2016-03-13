
import env from '../env'

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = env.name
} else {
  env.name = process.env.NODE_ENV
}
