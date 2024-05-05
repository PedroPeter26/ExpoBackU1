import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
    Route.get('/:id', 'UsersController.show').middleware('auth:api')
    Route.post('/login','UsersController.login')
    Route.post('/logout', 'UsersController.logout').middleware('auth:api')
    Route.post('/', 'UsersController.register')
    Route.put('/actualizar', 'UsersController.update').middleware('auth:api')
}).prefix('/api/users')
