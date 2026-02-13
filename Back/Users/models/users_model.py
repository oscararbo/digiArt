from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.conf import settings


class CustomUserManager(BaseUserManager):
    def create_user(self, email=None, username=None, password=None, **extra_fields):
        if not username:
            raise ValueError('El usuario debe de tener un nombre de usuario')
        
        if not email:
            raise ValueError('El usuario debe de tener un correo válido')
        if "@" not in email:
            raise ValueError('No es un formato de correo válido')

        if any(ext in email for ext in settings.EXTENSIONES_BLACKLIST):
            raise ValueError(
                f"No está permitido crear una cuenta con este dominio. Dominios no permitidos: " + 
                ", ".join(settings.EXTENSIONES_BLACKLIST))

        if not password:
            raise ValueError("La contraseña no es válida")

        email = self.normalize_email(email)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email=None, username=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, username, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=100, unique=True, blank=False, null=False)
    username = models.CharField(max_length=50, blank=True, null=True)
    nombre = models.CharField(max_length=50, null=True, blank=True, default="")
    apellidos = models.CharField(max_length=50, null=True, blank=True, default="")
    is_active = models.BooleanField(default=True, verbose_name="¿Está activo?",
                                    help_text="Si está desactivado, el usuario no podrá acceder a su cuenta")

    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        ordering = ['-is_superuser', 'is_active', 'email']
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        full_name = f"{self.nombre} {self.apellidos}".strip()
        if not full_name:
            full_name = "Sin nombre"
        return f"{self.username} - {full_name} ({self.email})"

    def get_full_name(self):
        return f"{self.nombre} {self.apellidos}".strip()

    def get_short_name(self):
        return self.nombre
