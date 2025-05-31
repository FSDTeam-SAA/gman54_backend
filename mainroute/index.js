const express = require('express')
const router = express.Router()
const authRoute = require("../route/auth.route")



const moduleRoutes = [
    {
        path: "/auth",
        route: authRoute
    }


]


moduleRoutes.forEach((route) => {
    if (route.middleware) {
        router.use(route.path, ...route.middleware, route.route);
    } else {
        router.use(route.path, route.route);
    }
}
)
module.exports = router