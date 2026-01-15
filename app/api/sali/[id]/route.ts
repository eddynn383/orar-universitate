import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest, ctx: RouteContext<'/api/classroom/[id]'>) {
    const { id } = await ctx.params

    const classroom = await prisma.classroom.findUnique({
        where: {
            id
        },
    })
    return NextResponse.json(classroom, { status: 200 })
}

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/classroom/[id]'>) {
    const body = await request.json()
    const { id } = await ctx.params

    const updatedClassroom = await prisma.classroom.update({
        where: {
            id
        },
        data: body
    })
    return NextResponse.json(updatedClassroom, { status: 200 })
}

export async function DELETE(request: NextRequest, ctx: RouteContext<'/api/classroom/[id]'>) {
    const { id } = await ctx.params

    const deletedClassroom = await prisma.classroom.delete({
        where: {
            id
        },
    })
    return NextResponse.json(deletedClassroom, { status: 204 })
}