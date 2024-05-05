import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import Database from '@ioc:Adonis/Lucid/Database'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class UsersController {
  /**
   * @swagger
   * /api/users:
   *  post:
   *      tags:
   *        - users
   *      summary: Crear un nuevo usuario
   *      description: Crea un nuevo usuario con los datos proporcionados.
   *      requestBody:
   *        required: true
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/UserInput'
   *            example:
   *              name: John
   *              lastname: Doe
   *              email: john.doe@example.com
   *              password: password123
   *      responses:
   *        201:
   *          description: Usuario creado exitosamente.
   *          content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  data:
   *                    type: object
   *                    properties:
   *                      user_id:
   *                        type: number
   *                        description: ID del usuario creado.
   *                      name:
   *                        type: string
   *                        description: Nombre del usuario.
   *                      lastname:
   *                        type: string
   *                        description: Apellido del usuario.
   *                      email:
   *                        type: string
   *                        description: Correo electrónico del usuario.
   *        400:
   *          description: Error al crear el usuario. El correo electrónico proporcionado ya está registrado.
   *          content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  message:
   *                    type: string
   *                    example: Error al crear usuario
   *                  error:
   *                    type: string
   *                    example: Correo electrónico ya registrado
   *        500:
   *          description: Error interno del servidor al intentar crear el usuario.
   *          content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  message:
   *                    type: string
   *                    example: Error al crear usuario
   *                  error:
   *                    type: string
   *                    example: Descripción del error interno
   *  components:
   *    schemas:
   *      UserInput:
   *        type: object
   *        properties:
   *          name:
   *            type: string
   *          lastname:
   *            type: string
   *          email:
   *            type: string
   *          password:
   *            type: string
   *        required:
   *          - name
   *          - lastname
   *          - email
   *          - password
   */
  public async register({request, response}: HttpContextContract) {
    try {
      const validationSchema = schema.create({
        email: schema.string({}, [
          rules.email()
        ]),
        password: schema.string({}, [
          rules.minLength(8)
        ])
      })

      await request.validate({
        schema: validationSchema
      })

      const name = request.input('name');
      const lastname = request.input('lastname');
      const email = request.input('email')
      const password = request.input('password');

      const existingUser = await User.findBy('email', email);
      if (existingUser) {
        return response.status(400).json({
          type: 'Error',
          message: 'Error al crear usuario',
          error: 'Correo electrónico ya registrado',
        });
      }

      const newUser = new User();
      newUser.name = name;
      newUser.lastname = lastname;
      newUser.email = email;
      newUser.password = await Hash.make(password);

      await newUser.save();

      return response.status(201).json({
        type: 'Success',
        title: 'Registro exitoso',
        message:'Usuario registrado correctamente.',
        data: {
          user_id: newUser.id,
          name: newUser.name,
          lastname: newUser.lastname,
          email: newUser.email,
        },
      });
    } catch (error) {
      return response.status(400).json({
        type: 'Error',
        title: 'Error registrar usuario',
        message: 'Error al crear usuario, revise alguno de los datos.',
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /api/users/login:
   *  post:
   *    tags:
   *      - users
   *    summary: Iniciar sesión de usuario
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              email:
   *                type: string
   *                description: Correo electrónico del usuario
   *              password:
   *                type: string
   *                description: Contraseña del usuario
   *    responses:
   *      200:
   *        description: Inicio de sesión exitoso
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                token:
   *                  type: string
   *                  description: Token de autenticación generado
   *      401:
   *        description: Credenciales inválidas
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                message:
   *                  type: string
   *                  example: Usuario no encontrado
   *      500:
   *        description: Error interno del servidor
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                message:
   *                  type: string
   *                  example: Error al iniciar sesión
   *                error:
   *                  type: string
   */
  public async login({ request, auth, response }: HttpContextContract) {
    try {
      const email = request.input('email');
      const password = request.input('password');
      // Verificar las credenciales del usuario
      const user = await User.query().where('email', email).first();

      if (!user) {
        return response.status(404).json({ message: 'Usuario no encontrado' });
      }

      const isPasswordValid = await Hash.verify(user.password, password);
      if (!isPasswordValid) {
        return response.status(401).json({ message: 'Contraseña incorrecta' });
      }

      const token = await auth.use('api').generate(user, { expiresIn: '3 days' });

      return response.status(200).json({
        type: 'Success',
        title: 'Login exitoso',
        message: 'Login realizado exitosamente',
        data: {
          Token: token,
          User: user
        }
      })

    } catch (error) {
      return response.status(500).json({
        type: 'Error',
        title: 'Error al iniciar sesion',
        message: 'Error al iniciar sesión: ', error: error.message });
    }
  }

  /**
   * @swagger
   * /api/users/logout:
   *  post:
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - users
   *    summary: Cierre de sesión de usuario
   *    description: Cierra la sesión actual del usuario.
   *    responses:
   *       200:
   *        description: Sesión cerrada exitosamente.
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                message:
   *                  type: string
   *                  description: Mensaje indicando el éxito del cierre de sesión.
   */
  public async logout({ auth, response }: HttpContextContract) {
    try {
      await auth.logout()
      return response.status(200).send({
        type: 'Success',
        title: 'Logout exitoso',
        message: 'Logout realizado exitosamente '
      })

    } catch (error) {
      return response.status(500).send({
        type: 'Error',
        title: 'Error al cerrar sesion',
        message: 'Se produjo un error al cerrar sesion'
      })
      
    }
  }

  //public async index({}: HttpContextContract) {}

  //public async create({}: HttpContextContract) {}

  //public async store({}: HttpContextContract) {}

  /**
   * @swagger
   * /api/users/{id}:
   *  get:
   *    security:
   *      - bearerAuth: []
   *    tags:
   *      - users
   *    summary: Lista de usuarios
   *    produces:
   *      - application/json
   *    parameters:
   *      - name: id
   *        in: path
   *        required: true
   *        description: ID del usuario a mostrar.
   *        schema:
   *          type: integer
   *    responses:
   *      200:
   *        description: Success!!
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                title:
   *                  type: string
   *                  description: title 
   *                data:
   *                  type: string 
   *                  description: jajajaj
   */
  public async show({response, params}: HttpContextContract) {
    const users = await User.findOrFail(params.id)
    if(!users) {
      return response.status(404).send({
        type: 'Error',
        title: 'Error al obtener usuario por ID',
        message: 'El ID no coincide con ningpun usuario registrado.'
      })
    }

    return response.status(200).send({
      type: 'Success',
      title: 'Usuario coincidente con el ID',
      message: 'Usuario encontrado por el ID',
      data: users
    })
  }

  //public async edit({}: HttpContextContract) {}

  /**
 * @swagger
 * /api/users/actualizar:
 *  put:
 *    security:
 *      - bearerAuth: []
 *    tags:
 *      - users
 *    summary: Actualización de datos de usuario
 *    description: Actualiza los datos de un usuario existente. Cada campo es opcional y se actualizará solo si está presente en la solicitud.
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *              lastname:
 *                type: string
 *              email:
 *                type: string
 *    responses:
 *       200:
 *        description: Datos de usuario actualizados exitosamente.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  description: Mensaje indicando el éxito de la actualización.
 *       401:
 *        description: Usuario no autenticado.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 *                  description: Mensaje indicando el error de autenticación.
 *       500:
 *        description: Error interno del servidor al actualizar los datos del usuario.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  description: Mensaje indicando el error interno del servidor.
 */
  public async update({request, auth, response}: HttpContextContract) {
    try {
      const user = auth.user!;    
      const { name, lastname, email } = request.only(['name', 'lastname', 'email']);
  
      if (email !== undefined) {
        const existingUser = await User.findBy('email', email);
        if (existingUser && existingUser.id !== user.id) {
          return response.status(400).json({ 
            type: 'Error',
            title: 'Correo electrónico duplicado',
            message: 'El correo electrónico proporcionado ya está asociado a usuario',
          });
        }
      }
  
      const updates: { [key: string]: any } = {};
      if (name !== undefined) {
        updates.name = name;
      }
      if (lastname !== undefined) {
        updates.lastname = lastname;
      }
      if (email !== undefined) {
        updates.email = email;
      }
  
      await Database.from('users').where('id', user.id).update(updates);
      const updatedUser = await Database.from('users').where('id', user.id).first();
  
      return response.status(200).json({
        type: 'Success',
        title: 'Datos actualizados',
        message: 'Datos de usuario actualizados', 
        data: updatedUser 
      });
    } catch (error) {
      return response.status(500).json({ 
        type: 'Error',
        title: 'Error de servidor',
        message: 'Error interno del servidor al actualizar los datos del usuario', 
        error: error.message 
      });
    }
  }

  //public async destroy({}: HttpContextContract) {}
}
