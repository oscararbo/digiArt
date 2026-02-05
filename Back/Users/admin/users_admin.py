from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from Users.models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ('email', 'nombre', 'apellidos', 'is_active', 'is_staff', 'is_superuser')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'fecha_creacion')
    search_fields = ('email', 'nombre', 'apellidos')
    ordering = ('-fecha_creacion',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información Personal', {'fields': ('nombre', 'apellidos')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas', {'fields': ('fecha_creacion', 'fecha_actualizacion')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )

    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')
