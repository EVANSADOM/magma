#!/usr/bin/env python3
# @generated AUTOGENERATED file. Do not Change!

from dataclasses import dataclass
from datetime import datetime
from functools import partial
from gql.gql.datetime_utils import DATETIME_FIELD
from numbers import Number
from typing import Any, Callable, List, Mapping, Optional

from dataclasses_json import DataClassJsonMixin

from .equipment_port_input import EquipmentPortInput
from .equipment_position_input import EquipmentPositionInput
from .property_type_input import PropertyTypeInput
@dataclass
class AddEquipmentTypeInput(DataClassJsonMixin):
    name: str
    positions: List[EquipmentPositionInput]
    ports: List[EquipmentPortInput]
    properties: List[PropertyTypeInput]
    category: Optional[str] = None

