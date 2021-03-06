#!/usr/bin/env python3
# @generated AUTOGENERATED file. Do not Change!

from dataclasses import dataclass
from datetime import datetime
from gql.gql.datetime_utils import DATETIME_FIELD
from gql.gql.graphql_client import GraphqlClient
from functools import partial
from numbers import Number
from typing import Any, Callable, List, Mapping, Optional

from dataclasses_json import DataClassJsonMixin


@dataclass
class LocationDetailsQuery(DataClassJsonMixin):
    __QUERY__: str = """
    query LocationDetailsQuery($id: ID!) {
  location: node(id: $id) {
    ... on Location {
      id
      name
      latitude
      longitude
      externalId
      locationType {
        name
      }
    }
  }
}

    """

    @dataclass
    class LocationDetailsQueryData(DataClassJsonMixin):
        @dataclass
        class Node(DataClassJsonMixin):
            @dataclass
            class LocationType(DataClassJsonMixin):
                name: str

            id: str
            name: str
            latitude: Number
            longitude: Number
            locationType: LocationType
            externalId: Optional[str] = None

        location: Optional[Node] = None

    data: Optional[LocationDetailsQueryData] = None

    @classmethod
    # fmt: off
    def execute(cls, client: GraphqlClient, id: str):
        # fmt: off
        variables = {"id": id}
        response_text = client.call(cls.__QUERY__, variables=variables)
        return cls.from_json(response_text).data
