"""Router de Pedidos — endpoints CRUD con FSM de estados."""

from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Path, Query, status
from pydantic import BaseModel

from app.core.deps import get_current_user, require_role
from app.core.uow import UnitOfWork, get_uow
from app.modules.pedidos.schemas import (
    AvanzarEstadoRequest,
    EstadoPedidoResponse,
    FormaPagoResponse,
    PaginatedPedidos,
    PedidoCreate,
    PedidoDetail,
    PedidoResponse,
)
from app.modules.pedidos.service import PedidoService
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/api/v1/pedidos", tags=["Pedidos"])


class CancelarRequest(BaseModel):
    motivo: str


@router.get("/estados", response_model=List[EstadoPedidoResponse])
def listar_estados(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return PedidoService(uow).listar_estados()


@router.get("/formas-pago", response_model=List[FormaPagoResponse])
def listar_formas_pago(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return PedidoService(uow).listar_formas_pago()


@router.get("", response_model=PaginatedPedidos)
def listar_pedidos(
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 10,
    estado: Annotated[Optional[str], Query(description="Filtrar por estado")] = None,
    uow: Annotated[UnitOfWork, Depends(get_uow)] = None,
    current_user: Annotated[Usuario, Depends(get_current_user)] = None,
):
    return PedidoService(uow).listar_pedidos(page=page, per_page=per_page, estado_codigo=estado, usuario=current_user)


@router.post(
    "",
    response_model=PedidoResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["CLIENT", "ADMIN"]))],
)
def crear_pedido(
    data: PedidoCreate,
    uow: Annotated[UnitOfWork, Depends(get_uow)] = None,
    current_user: Annotated[Usuario, Depends(get_current_user)] = None,
):
    return PedidoService(uow).crear_pedido(data, current_user)


@router.get("/{pedido_id}", response_model=PedidoDetail, responses={404: {"description": "Pedido no encontrado"}})
def obtener_pedido(
    pedido_id: Annotated[int, Path(ge=1)],
    uow: Annotated[UnitOfWork, Depends(get_uow)] = None,
    current_user: Annotated[Usuario, Depends(get_current_user)] = None,
):
    return PedidoService(uow).obtener_detalle(pedido_id, current_user)


@router.patch(
    "/{pedido_id}/estado",
    response_model=PedidoResponse,
    responses={404: {"description": "Pedido no encontrado"}, 409: {"description": "Transición inválida"}},
    dependencies=[Depends(require_role(["ADMIN", "PEDIDOS"]))],
)
def avanzar_estado(
    pedido_id: Annotated[int, Path(ge=1)],
    data: AvanzarEstadoRequest,
    uow: Annotated[UnitOfWork, Depends(get_uow)] = None,
    current_user: Annotated[Usuario, Depends(get_current_user)] = None,
):
    return PedidoService(uow).avanzar_estado(pedido_id, data, current_user)


@router.post(
    "/{pedido_id}/cancelar",
    response_model=PedidoResponse,
    responses={404: {"description": "Pedido no encontrado"}, 409: {"description": "No se puede cancelar"}},
)
def cancelar_pedido(
    pedido_id: Annotated[int, Path(ge=1)],
    data: CancelarRequest,
    uow: Annotated[UnitOfWork, Depends(get_uow)] = None,
    current_user: Annotated[Usuario, Depends(get_current_user)] = None,
):
    return PedidoService(uow).cancelar_pedido(pedido_id, data.motivo, current_user)