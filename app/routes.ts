import {type RouteConfig, index, route} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('/auth', 'routes/auth.tsx'),
    route('/upload','routes/upload.tsx'),
    route('/resume/:id','routes/resume.tsx'),
    route('/api/analyze','routes/api.analyze.ts'),
    route('/wipe','routes/wipe.tsx')
] satisfies RouteConfig;