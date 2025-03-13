#version 300 es
precision mediump float;

uniform float gridWidth;
uniform float gridHeight;

in vec3 pos;
in vec3 norm;
in float ao;

out vec4 fragColour;

const vec3 matColour = vec3(1.0f);

void main()
{
    float ambient =  ao * 0.5f;
    float diffuse = 0.6f * max(dot(norm, normalize(vec3(-0.5, 0.8, -0.65))), 0.0f);
    vec3 colour = matColour * (diffuse + ambient);

    float fogx = 0.5f + 0.5f * min(pos.x, pos.z) / gridWidth;
    float fogy = 0.5f - 0.5f * pos.y / gridHeight;
    float fog = min(fogx, fogy);

    colour = (1.0f - fog) * colour;
    fragColour = vec4(colour, 1.0f);
}