import { DateTime } from 'luxon'
import { column,  BaseModel } from '@ioc:Adonis/Lucid/Orm'

export default class User extends BaseModel {

  /**
 * @swagger
 * components:
 *  schemas:
 *    Users:
 *      type: object
 *      properties:
 *        id:
 *          type: integer
 *          example: 10
 *        name:
 *          type: string
 *          example:  Naruto
 *        lastname:
 *          type: string
 *          example:  Uzumaki
 *        email:
 *          type: string
 *          example: bolillo@gmail.com
 *        password:
 *          type: string
 *          example: passwd1234
 *      required:
 *        - id
 *        - name
 *        - lastname
 *        - email
 *        - password
 */

  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public lastname: string

  @column()
  public email: string

  @column()
  public password: string

  @column()
  public rememberMeToken: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
