#version 300 es
precision mediump float;

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

    float fog = 0.5f + 0.1f * min(pos.x, min(-pos.y, pos.z));

    colour = (1.0f - fog) * colour;
    fragColour = vec4(colour, 1.0f);
}