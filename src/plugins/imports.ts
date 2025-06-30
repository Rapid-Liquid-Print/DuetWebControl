/**
 * DO NOT MODIFY THIS FILE! IT IS AUTO-GENERATED ON COMPILATION!
*/
import { initCollection } from "@duet3d/objectmodel";
import DwcPlugin from "./DwcPlugin";

export default initCollection(DwcPlugin, [
	{
        id: "GCodeViewer",
        name: "G-Code Viewer",
        author: "Juan Rosario",
        version: "3.5.3",
        loadDwcResources: () => import(
            /* webpackChunkName: "GCodeViewer" */
            "./GCodeViewer/index"
        )
    },
	{
        id: "HeightMap",
        name: "Height Map",
        author: "Duet3D Ltd",
        version: "3.5.3",
        loadDwcResources: () => import(
            /* webpackChunkName: "HeightMap" */
            "./HeightMap/index"
        )
    },
	{
        id: "Info",
        name: "Info",
        author: "RLP",
        version: "1.0.0",
        loadDwcResources: () => import(
            /* webpackChunkName: "Info" */
            "./Info/index"
        )
    },
	{
        id: "InputShaping",
        name: "Input Shaping",
        author: "Duet3D Ltd",
        version: "3.5.3",
        loadDwcResources: () => import(
            /* webpackChunkName: "InputShaping" */
            "./InputShaping/index"
        )
    },
	{
        id: "Jogging",
        name: "Jogging",
        author: "RLP",
        version: "1.0.0",
        loadDwcResources: () => import(
            /* webpackChunkName: "Jogging" */
            "./Jogging/index"
        )
    },
	{
        id: "OnScreenKeyboard",
        name: "On-Screen Keyboard",
        author: "Duet3D Ltd",
        version: "3.5.3",
        loadDwcResources: () => import(
            /* webpackChunkName: "OnScreenKeyboard" */
            "./OnScreenKeyboard/index"
        )
    },
	{
        id: "Purging",
        name: "Purging",
        author: "RLP",
        version: "1.0.0",
        loadDwcResources: () => import(
            /* webpackChunkName: "Purging" */
            "./Purging/index"
        )
    },
	{
        id: "RLPBackDisplay",
        name: "RLP Back Display",
        author: "RLP",
        version: "1.0.0",
        loadDwcResources: () => import(
            /* webpackChunkName: "RLPBackDisplay" */
            "./RLPBackDisplay/index"
        )
    },
	{
        id: "RLPStatus",
        name: "RLP Status page",
        author: "RLP",
        version: "1.0.0",
        loadDwcResources: () => import(
            /* webpackChunkName: "RLPStatus" */
            "./RLPStatus/index"
        )
    },
]);
