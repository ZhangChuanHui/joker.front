# Joker(front)

## 前端 核心平台

Joker.front 是 Jokers.pub 旗下前端项目，负责前端渲染

Joker.front 旨在提供一套渐进式前端框架，提供多端运行能力，目前已完成 Joker.H5 前端项目框架，后续将提供 Joker.native/Joker.wx 等

## 特色

1. 双向数据监听

2. 单向数据流

3. vnode 虚拟 dom 节点，可扩展多端输出

4. 更快的运行速度，数据变更实时响应，无延迟、无 dom 树对比，使用更方便

5. 新的语法，不限制根节点数目

6. Class API 开发模式

7. 提供组件化、混入等基础功能

8. 提供数据劫持/监听；Node 监听；状态管理器等功能

## 特别说明

**本框架为底层核心库，需要配合 joker-cli 和 vscode-joker 可视化插件进行使用**

## 阶段

**核心库处于内侧阶段，cli 及可视化编辑器将在近期与公测版本一起推出，敬请期待**

## 抢先看

```
<div @click="点击事件"  attr1="@(sss+1)" @tap.stop.prevent.once.self="tab事件(其他参数)">
    @变量
    @方法(参数)
    @if (true)
    {
        <p>我是一句话</p>
        <p>
            @变量
            @方法(1)
            @(1+1)

        </p>
    }
    else if{
        <p>我是else if</p>
    }
    else
    {
        <p>我是else</p>
    }


    @for (let i = 0; i < 数组.length; i++)
    {
        <p>@数组[i]</p>

    }

    @for(let index in 数组)
    {
        <p>suoyin :@index value: @数组[index]</p>
    }


    @for (let item of 对象)
    {
        <p>@item.a</p>
    }

    @for (let(index, item) in 数组)
    {
        <p>索引：@index 项：@item</p>
    }

</div>
<ChildrenComponent @click="组件回执方法" prop1="@变量">
    @section("id",内容参数1,内容参数2){
        <p>内容参数1</p>
        <p>@父组件变量</p>
    }
</ChildrenComponent>

<!--内容部分-->

@RenderSection()

@RenderSection("id",@对外传参)
```
