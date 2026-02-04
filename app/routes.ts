import {type RouteConfig, route} from "@react-router/dev/routes";

export default [
    route('/','routes/upload.tsx'),
    route('/resume/:id','routes/resume.tsx'),
    route('/api/analyze','routes/api.analyze.ts'),
    route('/wipe','routes/wipe.tsx')
] satisfies RouteConfig;