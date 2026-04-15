from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def secret_view(request):
    return Response({"message": "Du er logget ind 🔐"})


@api_view(['POST'])
def register_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if User.objects.filter(username=username).exists():
        return Response({"error": "User exists"}, status=400)

    User.objects.create_user(username=username, password=password)

    return Response({"message": "User created"})