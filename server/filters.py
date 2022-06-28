import datetime
import json
import re
import time

import dateutil
import six
from json2html import *
from json2table import convert


def filter_map_priority(p):
    PRIORITY = {
        '-1': 'info',
        '40': 'low',
        '60': 'medium',
        '80': 'high',
        '100': 'critical'
    }
    return PRIORITY.get(p)


def filter_timectime(s):
    return time.ctime(s)  # datetime.datetime.fromtimestamp(s)


def filter_ternary(value, true_val, false_val, none_val=None):
    if value is None and none_val is not None:
        return none_val
    elif bool(value):
        return true_val
    else:
        return false_val


def filter_comment(text, style='plain', **kw):
    # Predefined comment types
    comment_styles = {
        'plain': {
            'decoration': '# '
        },
        'erlang': {
            'decoration': '% '
        },
        'c': {
            'decoration': '// '
        },
        'cblock': {
            'beginning': '/*',
            'decoration': ' * ',
            'end': ' */'
        },
        'xml': {
            'beginning': '<!--',
            'decoration': ' - ',
            'end': '-->'
        }
    }

    # Pointer to the right comment type
    style_params = comment_styles[style]

    if 'decoration' in kw:
        prepostfix = kw['decoration']
    else:
        prepostfix = style_params['decoration']

    # Default params
    p = {
        'newline': '\n',
        'beginning': '',
        'prefix': (prepostfix).rstrip(),
        'prefix_count': 1,
        'decoration': '',
        'postfix': (prepostfix).rstrip(),
        'postfix_count': 1,
        'end': ''
    }

    # Update default params
    p.update(style_params)
    p.update(kw)

    # Compose substrings for the final string
    str_beginning = ''
    if p['beginning']:
        str_beginning = "%s%s" % (p['beginning'], p['newline'])
    str_prefix = ''
    if p['prefix']:
        if p['prefix'] != p['newline']:
            str_prefix = str(
                "%s%s" % (p['prefix'], p['newline'])) * int(p['prefix_count'])
        else:
            str_prefix = str(
                "%s" % (p['newline'])) * int(p['prefix_count'])
    str_text = ("%s%s" % (
        p['decoration'],
        # Prepend each line of the text with the decorator
        text.replace(
            p['newline'], "%s%s" % (p['newline'], p['decoration'])))).replace(
        # Remove trailing spaces when only decorator is on the line
        "%s%s" % (p['decoration'], p['newline']),
        "%s%s" % (p['decoration'].rstrip(), p['newline']))
    str_postfix = p['newline'].join(
        [''] + [p['postfix'] for x in range(p['postfix_count'])])
    str_end = ''
    if p['end']:
        str_end = "%s%s" % (p['newline'], p['end'])

    # Return the final string
    return "%s%s%s%s%s" % (
        str_beginning,
        str_prefix,
        str_text,
        str_postfix,
        str_end)


class DotAccessibleDict:
    reserved = ['self']

    def __init__(self, **kwargs):
        for key, val in kwargs.items():
            if key in self.reserved:
                # in our case, we have a key in dict which is "self", and it would cause problems while parsing
                key = f'_{key}'
            if type(val) == dict:
                setattr(self, key, DotAccessibleDict(**val))
            elif type(val) == list:
                setattr(self, key, [DotAccessibleDict(**el) if isinstance(el, dict) else el for el in val])
            else:
                setattr(self, key, val)

    def get(self, index):
        target = self
        parts = index.split('.')
        for i in parts:
            if isinstance(target, list):
                target = target[0]
            target = getattr(target, i)
        return target

    def set(self, index, value):
        if index:
            parts = index.split('.')
            tmp_obj = getattr(self, parts[0]) if hasattr(self, parts[0]) else DotAccessibleDict()
            if len(parts) > 1:
                tmp_obj.set('.'.join(parts[1:]), value)
            else:
                tmp_obj = value
            setattr(self, parts[0], tmp_obj)
        return self

    def filter(self, fields):
        new_dict = DotAccessibleDict()
        for field in fields:
            new_dict.set(field, self.get(field))
        return new_dict

    def to_dict(self):
        obj = {}
        for i in self.__dict__:
            val = getattr(self, i)
            if isinstance(val, DotAccessibleDict):
                obj[i] = val.to_dict()
            elif isinstance(val, list):
                obj[i] = [el.to_dict() if isinstance(el, DotAccessibleDict) else el for el in val]
            else:
                obj[i] = val
        return obj


def filter_json2tbl(json_object, build_direction="LEFT_TO_RIGHT", table_attributes=None):
    if isinstance(json_object, dict):
        return convert(json_object, build_direction=build_direction, table_attributes=table_attributes)
    if isinstance(json_object, list):
        if table_attributes and 'class' in table_attributes:
            return json2html.convert(json=json_object, table_attributes=f"class=\"{table_attributes['class']}\"")
        return json2html.convert(json=json_object)


def filter_to_json(a, *args, **kw):
    return json.dumps(a, *args, **kw)


def filter_to_nice_json(a, indent=4, sort_keys=True, *args, **kw):
    return filter_to_json(a, indent=indent, sort_keys=sort_keys, separators=(',', ': '), *args, **kw)


def filter_is_in_list(val, in_list):
    return True if val in in_list else False


def _get_regex_flags(ignorecase=False):
    return re.I if ignorecase else 0


def filter_regex_match(value, pattern, ignorecase=False):
    if not isinstance(value, six.string_types):
        value = str(value)
    flags = _get_regex_flags(ignorecase)
    return bool(re.match(pattern, value, flags))


def filter_regex_replace(value, pattern, replacement, ignorecase=False):
    if not isinstance(value, six.string_types):
        value = str(value)
    flags = _get_regex_flags(ignorecase)
    regex = re.compile(pattern, flags)
    return regex.sub(replacement, value)


def filter_regex_search(value, pattern, ignorecase=False):
    if not isinstance(value, six.string_types):
        value = str(value)
    flags = _get_regex_flags(ignorecase)
    return bool(re.search(pattern, value, flags))


def filter_regex_substring(value, pattern, result_index=0, ignorecase=False):
    if not isinstance(value, six.string_types):
        value = str(value)
    flags = _get_regex_flags(ignorecase)
    return re.findall(pattern, value, flags)[result_index]


def filter_filter_datetime(date, fmt="%Y/%m/%d %H:%M:%S"):
    try:
        if len(str(int(date))) == 13:
            ts = int(date) / 1000
            date = datetime.datetime.fromtimestamp(ts)
        elif len(str(int(date))) == 9 or len(str(int(date))) == 10:
            date = datetime.datetime.fromtimestamp(int(date))
        else:
            date = dateutil.parser.parse(date)
    except:
        date = dateutil.parser.parse(date)

    return date.strftime(fmt)


def filter_filter_json(json_object, include_keys):
    dynamic_object = DotAccessibleDict(**json_object)
    filter_keys = include_keys.split(",")
    filtered = dynamic_object.filter(filter_keys)
    return filtered.to_dict()


DOCS = {
    "Siemplify Platform": [
        {
            "name": "map_priority",
            "description": "map the numerical priority fields to their english representation.",
            "inputs": [
                {
                    "name": "priority",
                    "type": "int",
                    "description": "The numeric priority of the Siemplify case. Valid Options: -1, 40, 60, 80, 100"
                }
            ],
        }
    ],
    "Formatting": [
        {
            "name": "json2tbl",
            "description": "The json2tbl filter will format a JSON object into a HTML table. This provides an easy way to create insights from JSON data. Jinja will automatically encode all HTML characters. To prevent this, append the |safe filter to the Jinja template.",
            "inputs": [
                {
                    "name": "build_direction",
                    "type": "str",
                    "description": """String denoting the build direction of the table. Only supports dict input json_objects.
    If "TOP_TO_BOTTOM" child objects will be appended below parents, i.e. in the subsequent row.
    If "LEFT_TO_RIGHT" child objects will be appended to the right of parents, i.e. in the subsequent column.
    Default is "LEFT_TO_RIGHT". {"TOP_TO_BOTTOM", "LEFT_TO_RIGHT"}"""
                },
                {
                    "name": "table_attributes",
                    "type": "str",
                    "description": """Dictionary of (key, value) pairs describing attributes to add to the table. Each
    attribute is added according to the template key="value". For example, the table { "border" : 1 }
    modifies the generated table tags to include border="1" as an attribute.
    The generated opening tag would look like <table border="1">.
    Only supports "class" attribute for input json_object of list type.
    Default is None."""
                }
            ],
        },
        {
            "name": "to_nice_json",
            "description": """Formats a JSON object in a human readable format.
    Jinja will automatically encode JSON characters. To prevent this, append the |safe filter to the Jinja template.""",
            "inputs": [
                {
                    "name": "indent",
                    "type": "int",
                    "description": "The amount of spaces to indent the nested objects."
                },
                {
                    "name": "sort_keys",
                    "type": "bool",
                    "description": "True/False. Output will sort keys alphabetically."
                }
            ],
        },
        {
            "name": "comment",
            "description": "Comment code. Simply prefixes each line with the correct style of comment character.",
            "inputs": [
                {
                    "name": "style",
                    "type": "str",
                    "description": "Defaults to 'plain' (#). Valid Options: erlang (%), c (//), cblock (/* */) or xml (<!-- -->)"
                }
            ]
        }
    ],
    "DateTime": [
        {
            "name": "filter_datetime",
            "description": """A generic date/time string parser which is able to parse most known formats to represent a date and/or time. The output of the filter is in the format of:
"%Y/%m/%d %H:%M:%S""",
            "inputs": [
                {
                    "name": "DateTime",
                    "type": "str",
                    "description": "A date time string that will be parsed."
                }, {
                    "name": "Format",
                    "type": "str",
                    "description": """The format to return the new datetime value in. Supports strptime/strftime format codes.
Default: %Y/%m/%d %H:%M:%S"""
                }
            ],
        },
        {
            "name": "timectime",
            "description": """Converts a time expressed in seconds since the epoch to a string representing local time.""",
            "inputs": [
                {
                    "name": "Seconds",
                    "type": "int",
                    "description": "Time in seconds since the epoch."
                }
            ],
        }
    ],
    "Helpers": [
        {
            "name": "is_in_list",
            "description": """Returns true if a string value is in the supplied list. Returns false if it is not.""",
            "inputs": [
                {
                    "name": "list",
                    "type": "list",
                    "description": "The list to check to see if the list is in it or not."
                }
            ],
        },
        {
            "name": "ternary",
            "description": """Evaluates an expression and returns the object based on the result. Equvilent to - if value return true_val else return false_val""",
            "inputs": [
                {
                    "name": "true_val",
                    "type": "any",
                    "description": "Return this object if the value is true."
                },
                {
                    "name": "false_val",
                    "type": "any",
                    "description": "Return this object if the value is false."
                },
                {
                    "name": "none_val",
                    "type": "any",
                    "description": "Return this object if the value is None. None by default."
                }
            ],
        },
        {
            "name": "to_json",
            "description": "Returns JSON string from JSON object. Inputs are the same as json.dumps()",
            "inputs": []
        },
        {
            "name": "filter_json",
            "description": "Filters Json object based on keys input.",
            "inputs": [{
                "name": "include_keys",
                "type": "str",
                "description": "Keys to include in the new JSON, comma seperated."
            }]
        }
    ],
    "Regular Expression": [
        {
            "name": "regex_match",
            "description": """Returns True if value matches pattern, False otherwise""",
            "inputs": [
                {
                    "name": "pattern",
                    "type": "str",
                    "description": "The pattern to search."
                },
                {
                    "name": "ignorecase",
                    "type": "bool",
                    "description": "Ignore character case. False by default."
                }
            ],
        },
        {
            "name": "regex_replace",
            "description": """Replace all occurrences of pattern with a value""",
            "inputs": [
                {
                    "name": "pattern",
                    "type": "str",
                    "description": "The pattern to search."
                },
                {
                    "name": "replacement",
                    "type": "str",
                    "description": "The replacement string"
                },
                {
                    "name": "ignorecase",
                    "type": "bool",
                    "description": "Ignore character case. False by default."
                }
            ],
        },
        {
            "name": "regex_search",
            "description": """Returns True if pattern is found in """,
            "inputs": [
                {
                    "name": "pattern",
                    "type": "str",
                    "description": "The pattern to search."
                },
                {
                    "name": "replacement",
                    "type": "str",
                    "description": "The replacement string"
                },
                {
                    "name": "ignorecase",
                    "type": "bool",
                    "description": "Ignore character case. False by default."
                }
            ],
        },
        {
            "name": "regex_substring",
            "description": """Find all occurrences of the pattern in the input string. Accessed by indexes via the result_value parameter""",
            "inputs": [
                {
                    "name": "pattern",
                    "type": "str",
                    "description": "The pattern to search."
                },
                {
                    "name": "result_index",
                    "type": "int",
                    "description": "Index of the result. 0 by default."
                },
                {
                    "name": "ignorecase",
                    "type": "bool",
                    "description": "Ignore character case. False by default."
                }
            ],
        }
    ]
}
