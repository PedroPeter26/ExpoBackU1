import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class Authenticate {
  public async handle({auth, response}: HttpContextContract, next: () => Promise<void>) {
    try {
      await auth.authenticate()
      await next()
    } catch (error) {
      response.unauthorized({ error: 'Usuario no autenticado' })
    }
  }
}
